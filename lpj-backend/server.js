const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const libre = require('libreoffice-convert');
const util = require('util');
const QRCode = require('qrcode');
const ImageModule = require('docxtemplater-image-module-free');

const libreConvert = util.promisify(libre.convert);

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const TEMPLATE_PATH = path.resolve(__dirname, 'LPJ_PUM_temp.docx');
const DESKTOP_DIR = path.join('C:', 'Users', 'uzlah', 'OneDrive', 'Desktop', 'Kantor');

app.options('*', cors());

app.post('/api/generate-lpj', upload.none(), async (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body, null, 2));

  try {
    console.log('Reading template file...');
    const content = await fsPromises.readFile(TEMPLATE_PATH, 'binary');
    console.log('Template file read successfully');

    console.log('Generating QR code...');
    const qrCodeData = `${req.body.no_request}-${req.body.nama_pemohon}-${req.body.tgl_lpj}`;
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

    const templateData = {
      ...req.body,
      tgl_lpj: new Date(req.body.tgl_lpj).toLocaleDateString('id-ID'),
      qrcode: qrCodeImagePath,
      rincianItems: req.body.rincianItems.map((item, index) => ({
        no: index + 1, // Auto-numbering
        deskripsi_pum: item.deskripsi,
        jumlah_pum: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga),
        deskripsi_lpj: item.deskripsi, // Assuming same description for LPJ
        jumlah_lpj: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga) // Assuming same amount for LPJ
      })),
      total: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(req.body.total)
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

    res.contentType('application/pdf');
    res.sendFile(outputPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      } else {
        console.log('PDF file sent to client');
        // Clean up temporary files
        fsPromises.unlink(qrCodeImagePath).catch(console.error);
        fsPromises.unlink(filledTemplatePath).catch(console.error);
        fsPromises.unlink(outputPath).catch(console.error);
      }
    });
  } catch (error) {
    console.error('Detailed server error:', error);
    res.status(500).send(`Server error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));