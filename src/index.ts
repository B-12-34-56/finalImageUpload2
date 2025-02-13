import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App)
  )
);
// curl -X POST \  -H "x-api-key:3wk8twZ2Msa01N92iRgXN2ony6mobzhK5DIcAKei" \  -F "image=@/path/to/image.jpg" \ "https://<api-id>.execute-api.<region>.amazonaws.com/prod/upload" 