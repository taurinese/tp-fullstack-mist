const express = require ('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(morgan('dev'));

app.use('/api/store', createProxyMiddleware({
    target: 'http://store-service:3001',
    changeOrigin: true
}))

app.use('/api/library', createProxyMiddleware({
    target: 'http://library-service:3002',
    changeOrigin: true
}))

app.listen(3000, () => {
    console.log('Gateway running on port 3000');
})