import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray, FormikErrors } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Container,
  IconButton,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import LoadingAnimation from './LoadingAnimation';

export interface RincianItem {
  deskripsi: string;
  harga: number;
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
  total: number;
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
  rincianItems: [{ deskripsi: '', harga: 0 }],
  total: 0,
  nama_approve_vpkeu: '',
  nama_approve_vptre: '',
  kode_departemen: '',
  nama_approve_vp: '',
  tgl_lpj: new Date().toISOString().split('T')[0],
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
      deskripsi: Yup.string().required('Deskripsi is required'),
      harga: Yup.number().required('Harga is required').min(0, 'Harga must be positive'),
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
    }, 60000); // Regenerate every minute

    return () => clearInterval(timer);
  }, []);
  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setLoadingMessage('Generating LPJ document...');
    try {
      const formData = {
        ...values,
        rincianItems: values.rincianItems.map((item, index) => ({
          no: index + 1,
          deskripsi: item.deskripsi,
          harga: parseFloat(item.harga.toString())
        })),
        total: values.rincianItems.reduce((sum, item) => sum + parseFloat(item.harga.toString()), 0)
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
    <Container maxWidth="md">
      {isLoading && <LoadingAnimation message={loadingMessage} />}
      <Paper elevation={3} sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h4" gutterBottom>
          LPJ Form
        </Typography>
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
                  if (key !== 'rincianItems' && key !== 'total') {
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

              <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>
                Rincian Keperluan PUM
              </Typography>
              <FieldArray name="rincianItems">
                {({ push, remove }) => (
                  <Box>
                    {values.rincianItems.map((_, index) => (
                      <Grid container spacing={2} key={index} sx={{ marginBottom: 2 }}>
                        <Grid item xs={5}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Deskripsi"
                            name={`rincianItems.${index}.deskripsi`}
                            error={touched.rincianItems?.[index]?.deskripsi && Boolean((errors.rincianItems?.[index] as FormikErrors<RincianItem>)?.deskripsi)}
                            helperText={touched.rincianItems?.[index]?.deskripsi && (errors.rincianItems?.[index] as FormikErrors<RincianItem>)?.deskripsi}
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <Field
                            as={TextField}
                            fullWidth
                            label="Harga"
                            name={`rincianItems.${index}.harga`}
                            type="number"
                            error={touched.rincianItems?.[index]?.harga && Boolean((errors.rincianItems?.[index] as FormikErrors<RincianItem>)?.harga)}
                            helperText={touched.rincianItems?.[index]?.harga && (errors.rincianItems?.[index] as FormikErrors<RincianItem>)?.harga}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setFieldValue(`rincianItems.${index}.harga`, Number(e.target.value));
                              const newTotal = values.rincianItems.reduce((sum, item, idx) => 
                                idx === index ? sum + Number(e.target.value) : sum + item.harga, 0
                              );
                              setFieldValue('total', newTotal);
                            }}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <IconButton onClick={() => remove(index)} disabled={values.rincianItems.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => push({ deskripsi: '', harga: 0 })}
                      variant="outlined"
                      sx={{ marginTop: 1, marginBottom: 2 }}
                    >
                      Add Item
                    </Button>
                  </Box>
                )}
              </FieldArray>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="TOTAL"
                  name="total"
                  value={values.total}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ marginBottom: 2 }}
                />
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
      </Paper>
    </Container>
  );
};

export default LPJForm;