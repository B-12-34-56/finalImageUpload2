import React from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ImageUploader } from './components/ImageUploader';

const theme = createTheme();

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <ImageUploader />
      </Container>
    </ThemeProvider>
  );
}