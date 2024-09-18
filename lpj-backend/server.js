const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const libre = require('libreoffice-convert');
const util = require('util');
const QRCode = require('qrcode');
const ImageModule = require('docxtemplater-image-module-free');

const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg')

const libreConvert = util.promisify(libre.convert);

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const TEMPLATE_PATH = path.resolve(__dirname, 'LPJ_PUM_temp.docx');
const DESKTOP_DIR = path.join('D:', 'Project', 'LPJFORM', 'lpj-backend', 'LPJ_PUM_temp');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lpj_history',
  password: '1234',
  port: 5432,
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS lpj_history (
    id SERIAL PRIMARY KEY,
    no_request VARCHAR(255) NOT NULL,
    tgl_lpj DATE NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

pool.query(createTableQuery)
    .then(() => console.log('Table created or already exists'))
    .catch(error => console.log('Error creating table:', error));

app.options('*', cors());

function formatCurrency(amount) {
  if (isNaN(amount) || amount === undefined) {
    console.error('Invalid amount for currency formatting:', amount);
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

app.post('/api/generate-lpj', upload.none(), async (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body, null, 2));

  try {
    console.log('Reading template file...');
    const content = await fsPromises.readFile(TEMPLATE_PATH, 'binary');
    console.log('Template file read successfully');

    console.log('Generating QR code...');
    const qrCodeData = req.body.no_request; // Only use the request number for the QR code
    const qrCodeImagePath = path.join(DESKTOP_DIR, `qrcode_${uuidv4()}.png`);
    await QRCode.toFile(qrCodeImagePath, qrCodeData, {
      errorCorrectionLevel: 'H',
      width: 150,
      margin: 1
    });
    console.log('QR code generated and saved to:', qrCodeImagePath);

    console.log('Replacing placeholders in template...');
    const zip = new PizZip(content);

    const imageModule = new ImageModule({
      centered: false,
      fileType: 'docx',
      getImage: function(tagValue) {
        return fs.readFileSync(tagValue);
      },
      getSize: function() {
        return [150, 150];
      }
    });

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{',
        end: '}',
      },
    });

    const rincianItems = req.body.rincianItems;
    console.log('Rincian Items:', JSON.stringify(rincianItems, null, 2));

   // Calculate totals from the received data
   const total_pum = rincianItems.reduce((sum, item) => sum + Number(item.jumlah_pum), 0);
   const total_lpj = rincianItems.reduce((sum, item) => sum + Number(item.jumlah_lpj), 0);

    console.log('Calculated total_pum:', total_pum);
    console.log('Calculated total_lpj:', total_lpj);

    const templateData = {
      ...req.body,
      tgl_lpj: new Date(req.body.tgl_lpj).toLocaleDateString('id-ID'),
      qrcode: qrCodeImagePath,
      rincianItems: rincianItems.map((item) => ({
        no: item.no,
        deskripsi_pum: item.deskripsi_pum,
        jumlah_pum: formatCurrency(Number(item.jumlah_pum)),
        deskripsi_lpj: item.deskripsi_lpj,
        jumlah_lpj: formatCurrency(Number(item.jumlah_lpj))
      })),
      total_pum: formatCurrency(total_pum),
      total_lpj: formatCurrency(total_lpj)
    };

    console.log('Template data:', JSON.stringify(templateData, null, 2));

    doc.render(templateData);

    const filledContent = doc.getZip().generate({ type: 'nodebuffer' });
    console.log('Document generated successfully');

    const filledTemplatePath = path.join(DESKTOP_DIR, `Filled_Template_${uuidv4()}.docx`);
    await fsPromises.writeFile(filledTemplatePath, filledContent);
    console.log('Filled template saved to:', filledTemplatePath);

    console.log('Converting to PDF format...');
    const pdfBuffer = await libreConvert(filledContent, '.pdf', undefined);

    const outputPath = path.join(DESKTOP_DIR, `LPJ_PUM_Output_${uuidv4()}.pdf`);
    await fsPromises.writeFile(outputPath, pdfBuffer);
    console.log('PDF saved to:', outputPath);
    
    const insertQuery = `
      INSERT INTO lpj_history (no_request, tgl_lpj, file_path)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const values = [req.body.no_request, new Date(req.body.tgl_lpj), outputPath];
    const result = await pool.query(insertQuery, values);
    console.log('Saved to database with id:', result.rows[0].id)

    res.contentType('application/pdf');
    res.sendFile(outputPath, async (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      } else {
        console.log('PDF file sent to client');
        
        // Clean up temporary files
        try {
          await fsPromises.unlink(qrCodeImagePath);
          await fsPromises.unlink(filledTemplatePath);
          // await fsPromises.unlink(outputPath);
          console.log('Temporary files cleaned up successfully');
        } catch (cleanupError) {
          console.error('Error cleaning up temporary files:', cleanupError);
        }
      }
    });
  } catch (error) {
    console.error('Detailed server error:', error);
    res.status(500).send(`Server error: ${error.message}`);
  }
});

app.get('/api/lpj-history', async (req, res) => {
  try {
    const query = 'SELECT * FROM lpj_history ORDER BY created_at DESC';
    const result = await pool.query(query);
    res.json(result.rows);  // Make sure we're sending JSON, not a string
  } catch (error) {
    console.error('Error fetching LPJ history:', error);
    res.status(500).json({ error: 'Error fetching LPJ history' });
  }
});

app.get('/api/lpj-history/download/:id', async(req, res) => {
  const id = req.params.id;
  try {
    const chooseFile = await pool.query('SELECT file_path FROM lpj_history WHERE id = $1', [id]);

    if(chooseFile.row.length === 0){
      return res.status(404).send('File not found');
    }

    const filePath = chooseFile.rows[0].file_path;

    if(!fs.existsSync(filePath)) {
      console.error(`File ${filePath} does not exist`);
      return res.status(404).send('File not found');
    }

    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(5);
    await fileHandle.read(buffer, 0, 5, 0);
    await fileHandle.close();

    if (buffer.toString() !== '%PDF-') {
      console.error(`File is not a valid PDF: ${filePath}`);
      return res.status(400).send('File is not a valid PDF');
    }

    const fileName = path.basename(filePath);

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      console.error(`Error reading file: ${error}`);
      res.status(500).send('Error reading file from server');
    });
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error during file download:', error);
    res.status(500).send('Server error during the file download');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));