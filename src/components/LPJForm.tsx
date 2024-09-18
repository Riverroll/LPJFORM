import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Container,
  IconButton,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import axios from 'axios';
import LoadingAnimation from './LoadingAnimation';

export interface RincianItem {
  id: number;
  deskripsi_pum: string;
  jumlah_pum: number;
  deskripsi_lpj: string;
  jumlah_lpj: number;
}

export interface FormValues {
  no_request: string;
  nama_pemohon: string;
  jabatan: string;
  nama_departemen: string;
  uraian: string;
  nama_jenis: string;
  jml_request: string;
  jml_terbilang: string;
  rincianItems: RincianItem[];
  total_pum: number;
  total_lpj: number;
  nama_approve_vpkeu: string;
  nama_approve_vptre: string;
  kode_departemen: string;
  nama_approve_vp: string;
  tgl_lpj: string;
}

const generateRequestNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ-${year}${month}${day}-${random}`;
};

const initialValues: FormValues = {
  no_request: generateRequestNumber(),
  nama_pemohon: '',
  jabatan: '',
  nama_departemen: '',
  uraian: '',
  nama_jenis: '',
  jml_request: '',
  jml_terbilang: '',
  rincianItems: [{ id: 1, deskripsi_pum: '', jumlah_pum: 0, deskripsi_lpj: '', jumlah_lpj: 0 }],
  nama_approve_vpkeu: '',
  nama_approve_vptre: '',
  kode_departemen: '',
  nama_approve_vp: '',
  tgl_lpj: new Date().toISOString().split('T')[0],
  total_pum: 0,
  total_lpj: 0
};

const validationSchema = Yup.object({
  nama_pemohon: Yup.string().required('Nama Pemohon is required'),
  jabatan: Yup.string().required('Jabatan is required'),
  nama_departemen: Yup.string().required('Nama Departemen is required'),
  uraian: Yup.string().required('Uraian is required'),
  nama_jenis: Yup.string().required('Nama Jenis is required'),
  jml_request: Yup.string().required('Jumlah Request is required'),
  jml_terbilang: Yup.string().required('Jumlah Terbilang is required'),
  rincianItems: Yup.array().of(
    Yup.object({
      deskripsi_pum: Yup.string().required('Deskripsi PUM is required'),
      jumlah_pum: Yup.number().required('Jumlah PUM is required').min(0, 'Jumlah PUM must be positive'),
      deskripsi_lpj: Yup.string().required('Deskripsi LPJ is required'),
      jumlah_lpj: Yup.number().required('Jumlah LPJ is required').min(0, 'Jumlah LPJ must be positive'),
    })
  ),
  nama_approve_vpkeu: Yup.string().required('Nama Approve VP Keuangan is required'),
  nama_approve_vptre: Yup.string().required('Nama Approve VP TRE is required'),
  kode_departemen: Yup.string().required('Kode Departemen is required'),
  nama_approve_vp: Yup.string().required('Nama Approve VP is required'),
});

const LPJForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [requestNumber, setRequestNumber] = useState(generateRequestNumber());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setRequestNumber(generateRequestNumber());
    }, 1500000); // Regenerate every minute

    return () => clearInterval(timer);
  }, []);
  
   const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setLoadingMessage('Generating LPJ document...');
    try {
      const rincianItems = values.rincianItems.map(item => ({
        no: item.id,
        deskripsi_pum: item.deskripsi_pum,
        jumlah_pum: Number(item.jumlah_pum),
        deskripsi_lpj: item.deskripsi_lpj,
        jumlah_lpj: Number(item.jumlah_lpj)
      }));

      const total_pum = rincianItems.reduce((sum, item) => sum + item.jumlah_pum, 0);
      const total_lpj = rincianItems.reduce((sum, item) => sum + item.jumlah_lpj, 0);

      const formData = {
        ...values,
        rincianItems,
        total_pum,
        total_lpj
      };

      const response = await axios.post('http://localhost:3001/api/generate-lpj', formData, {
        responseType: 'blob',
      });
      
      setLoadingMessage('Document generated. Preparing download...');
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = 'LPJ_PUM.pdf';
      link.click();
      setError(null);
    } catch (error) {
      console.error('Error generating document:', error);
      setError('An error occurred while generating the document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h3" gutterBottom>
          LPJ Form
      </Typography>
      
      {isLoading && <LoadingAnimation message={loadingMessage} />}

      <Formik
          initialValues={{...initialValues, no_request: requestNumber}}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <Grid container spacing={2}>
                {Object.keys(initialValues).map((key) => {
                  if (key !== 'rincianItems' && key !== 'total_pum' && key !== 'total_lpj') {
                    return (
                      <Grid item xs={12} sm={6} key={key}>
                        <Field
                          as={TextField}
                          fullWidth
                          label={key.replace(/_/g, ' ').toUpperCase()}
                          name={key}
                          error={touched[key as keyof FormValues] && Boolean(errors[key as keyof FormValues])}
                          helperText={touched[key as keyof FormValues] && errors[key as keyof FormValues]}
                          type={key === 'tgl_lpj' ? 'date' : 'text'}
                          InputProps={{
                            readOnly: key === 'no_request',
                          }}
                        />
                      </Grid>
                    );
                  }
                  return null;
                })}
              </Grid>

              <Typography variant='h4'sx={{ marginTop: 3, marginBottom: 2, fontSize: {xs:'1.25rem', sm:'2.125rem'} }}>
                Rincian Keperluan PUM dan LPJ
              </Typography>

              <FieldArray name="rincianItems">
                {({ push, remove }) => (
                  <Box>
                    {values.rincianItems.map((item, index) => (
                      <Grid container spacing={2} key={item.id} sx={{ marginBottom: 2 }}>
                        <Field
                          as={TextField}
                          value={item.id}
                          disabled
                          sx={{display:'none'}}
                        />
                        <Grid item xs={15} md={3}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Deskripsi PUM"
                            name={`rincianItems.${index}.deskripsi_pum`}
                          />
                        </Grid>
                        <Grid item xs={15} md={2}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Jumlah PUM"
                            name={`rincianItems.${index}.jumlah_pum`}
                            type="number"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value === '' ? 0 : Number(e.target.value);
                              setFieldValue(`rincianItems.${index}.jumlah_pum`, value);
                              const newTotalPUM = values.rincianItems.reduce((sum, item, i) => 
                                sum + (i === index ? value : Number(item.jumlah_pum)), 0);
                              setFieldValue('total_pum', newTotalPUM);
                            }}
                          />
                        </Grid>
                        <Grid item xs={15} md={3}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Deskripsi LPJ"
                            name={`rincianItems.${index}.deskripsi_lpj`}
                          />
                        </Grid>
                        <Grid item xs={15} md={2}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Jumlah LPJ"
                            name={`rincianItems.${index}.jumlah_lpj`}
                            type="number"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = e.target.value === '' ? 0 : Number(e.target.value);
                              setFieldValue(`rincianItems.${index}.jumlah_lpj`, value);
                              const newTotalLPJ = values.rincianItems.reduce((sum, item, i) => 
                                sum + (i === index ? value : Number(item.jumlah_lpj)), 0);
                              setFieldValue('total_lpj', newTotalLPJ);
                            }}
                          />
                        </Grid>
                        <Grid item xs={15} md={1}>
                          <IconButton onClick={() => remove(index)} disabled={values.rincianItems.length === 1}>
                            <RemoveIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => {
                        const newId = Math.max(...values.rincianItems.map(item => item.id), 0) + 1;
                        push({ id: newId, deskripsi_pum: '', jumlah_pum: 0, deskripsi_lpj: '', jumlah_lpj: 0 });
                      }}
                      variant="outlined"
                      sx={{ marginBottom: 3 }}
                    >
                      Add Item
                    </Button>
                  </Box>
                )}
              </FieldArray>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TOTAL PUM"
                    name="total_pum"
                    value={values.total_pum}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="TOTAL LPJ"
                    name="total_lpj"
                    value={values.total_lpj}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ marginBottom: 2 }}
                  />
                </Grid>
              </Grid>

              <Button type="submit" variant="contained" color="primary">
                Generate LPJ
              </Button>

              {error && (
                <Typography color="error" sx={{ marginTop: 2 }}>
                  {error}
                </Typography>
              )}
            </Form>
          )}
        </Formik>
    </Container>
  );
};

export default LPJForm;