const express = require('express');
const morgan = require('morgan');

const dealsRoutes = require('./routes/deals');
const steamRoutes = require('./routes/library');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use('/deals', dealsRoutes);
app.use('/steam', steamRoutes);


// Route de santé (Healthcheck)
app.get('/', (req, res) => {
    res.json({ status: "Import Service Online" });
});

app.listen(3003, () => {
    console.log('🔌 Import Service running on port 3003');
});