import React, { useState, useEffect } from 'react';
import { 
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import LoadingAnimation from './LoadingAnimation';
import axios from 'axios';

interface LPJHistoryItem {
    id: number;
    no_request: string;
    tgl_lpj: string;
    file_path: string;
    created_at: string;
}
  
const History: React.FC = () => {
    const [history, setHistory] = useState<LPJHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // const columns: GridColDef[] = [
    //   { field: 'no_request', headerName: 'No. Request', width:400},
    //   { field: 'tgl_lpj', headerName: 'Tanggal LPJ', width:400},
    //   { field: 'actions',
    //     headerName: 'Aksi',
    //     width:200,
    //     renderCell: (params) => (
    //       <Button onClick={() => handleDownload(params.row.id) }>
    //         <DownloadIcon />
    //       </Button>
    //     )
    //   }
    // ]

    useEffect(() => {
      const fetchHistory = async () => {
        try {
          const response = await axios.get('http://localhost:3001/api/lpj-history');
          console.log('API Response:', response.data);

          if (Array.isArray(response.data)) {
            setHistory(response.data);
          } else if (typeof response.data === 'object' && response.data !== null) {
            const possibleArrays = Object.values(response.data).filter(Array.isArray);
            if (possibleArrays.length > 0){
                setHistory(possibleArrays[0] as LPJHistoryItem[]);
            } else {
                throw new Error('No array found in the response');
            }
          } else {
            throw new Error(`Unexpected data structure: ${typeof response.data}`, );
          }
        } catch (error) {
            console.error('Error fetching LPJ history:', error);
            if(axios.isAxiosError(error)){
                setError(`Failed to load LPJ history. Server responded with: ${error.response?.status} ${error.response?.statusText}`);
            } else {
                setError('Failed to load LPJ history.');
            }
        } finally {
          setLoading(false);
        }
      };
  
      fetchHistory();
    }, []);

    const handleDownload = async(id: number) => {
      try {
        const response = await fetch(`/api/lpj-history/download/${id}`);
        if(!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `LPJ_PUM_${id}.pdf`
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download item, please try again');
      }
    }
  
    if (loading) {
      return <LoadingAnimation message='Loading LPJ history' />;
    };
  
    if (error) {
      return (
        <Typography color="error">
            {error}
            <br />
            <Button variant='contained' size='medium' onClick={() => window.location.reload()}>
                <DownloadIcon />
            </Button>
        </Typography>
      )
    }
  
    if (history.length === 0) {
      return (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Request</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography display="flex" justifyContent="center" alignItems="center" sx={{marginInline:'auto', marginBlock:2}}> No Data History </Typography>
                </TableCell>
              </TableRow>
             </TableBody>
          </Table>
        </TableContainer>
      )
    }
  
    return (
      <> 
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No. Request</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.no_request}</TableCell>
                  <TableCell>{new Date(item.tgl_lpj).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleDownload(item.id)}>
                      <DownloadIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> 
        </TableContainer>
        {/* <Paper sx={{ width: '100%' }}>  
          <DataGrid
            rows={history}
            columns={columns}
            sx={{
              bgcolor: '#fff',
              '& .MuiDataGrid-cell': {
                bgcolor: '#fff',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#f5f5f5',
              }, 
            }}
          />
        </Paper> */}
      </>
    );
  };
  
  export default History;