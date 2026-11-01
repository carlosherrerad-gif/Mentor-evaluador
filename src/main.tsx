import React from 'react';
import {createRoot} from 'react-dom/client';
import {WebApp} from './WebApp';
import './web.css';
import './theme.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><WebApp/></React.StrictMode>);
