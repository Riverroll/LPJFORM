import React, { useState, useEffect } from 'react';
import { 
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper
} from '@mui/material';

import axios from 'axios';
import LoadingAnimation from './LoadingAnimation';

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
  
    // if (loading) {
    //   return <CircularProgress />;
    // }
  
    if (error) {
      return (
        <Typography color="error">
            {error}
            <br />
            <Button onClick={() => window.location.reload()}>
                Retry 
            </Button>
        </Typography>
      )
    }
  
    if (history.length === 0) {
      return <Typography>No LPJ history available.</Typography>;
    }
  
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
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.no_request}</TableCell>
                <TableCell>{new Date(item.tgl_lpj).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button onClick={() => window.open(`http://localhost:3001/api/lpj-history/download/${item.id}`, '_blank')}>
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  export default History;