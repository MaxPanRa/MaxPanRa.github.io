import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { ConfigProvider } from 'antd';



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ConfigProvider theme={{ token: { fontFamily:"Roboto", colorPrimary: '#d0413e' } }}>
        <App />
    </ConfigProvider>
);

