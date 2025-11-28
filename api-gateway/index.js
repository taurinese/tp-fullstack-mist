const express = require ('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();

app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    credentials: true
}));
app.use(morgan('dev'));

// --- SWAGGER AGGREGATION ---
const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
        urls: [
            { url: 'http://localhost:3000/api/user/api-docs.json', name: 'User Service' },
            // Ajoutez ici les autres services quand ils auront leur doc Swagger
            { url: 'http://localhost:3000/api/store/api-docs.json', name: 'Store Service' },
            { url: 'http://localhost:3000/api/library/api-docs.json', name: 'Library Service' },
            { url: 'http://localhost:3000/api/import/api-docs.json', name: 'Import Service' },
        ]
    }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, swaggerOptions));


app.use('/api/store', createProxyMiddleware({
    target: 'http://store-service:3001',
    changeOrigin: true
}))

app.use('/api/library', createProxyMiddleware({
    target: 'http://library-service:3002',
    changeOrigin: true
}))

app.use('/api/import', createProxyMiddleware({
    target: 'http://import-service:3003',
    changeOrigin: true
}))

app.use('/api/user', createProxyMiddleware({
    target: 'http://user-service:3004',
    changeOrigin: true
}))

app.listen(3000, () => {
    console.log('Gateway running on port 3000');
})