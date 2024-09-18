import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import HistoryIcon from '@mui/icons-material/History';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import PostAddIcon from '@mui/icons-material/PostAdd';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import LPJForm from './LPJForm';
import History from './History';

import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 300;

interface Props {
  window?: () => Window;
}

export default function Appbar(props: Props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const DrawerContent = () => {

    return (
      <div>
        <Toolbar sx={{ marginBlock: 2 }}>
          <img src="bki.png" alt="" height={'80px'} style={{ margin: 'auto' }} />
        </Toolbar>
        <Divider />
        <List>
          {[
            { text: 'Add Form', icon: <PostAddIcon fontSize="large" />, path: '/' },
            { text: 'History', icon: <HistoryIcon fontSize="large" />, path: '/history' },
          ].map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => isMobile && handleDrawerToggle()}
              >
                <ListItemIcon sx={{ marginBlock: 1.5, color: '#1D456A' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="h6" sx={{ color: '#1D456A', fontWeight: 'thin' }}>{item.text}</Typography>
                </ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    );
  };

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
   <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {isMobile && (
          <AppBar
            position="fixed"
            sx={{
              width: '100%',
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <DrawerContent />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <DrawerContent />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
            ...(isMobile ? {
              mt: `${theme.mixins.toolbar.minHeight}px`,
              px: 2,
            } : {
            }),
          }}
        >
          <Routes>
            <Route path="/" element={<LPJForm />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Box>
      </Box>
   </Router>
  );
}