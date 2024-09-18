import React from 'react';
import Appbar from './components/Appbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Poppins',
    ].join(','),
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <Appbar />
      </div>
    </ThemeProvider>
  );
};

export default App;