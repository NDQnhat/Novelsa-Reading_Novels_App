import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { App as AntdApp, ConfigProvider } from 'antd';
import vi_VN from 'antd/locale/vi_VN';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={vi_VN}
      theme={{
        token: {
          zIndexPopupBase: 3000,
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);