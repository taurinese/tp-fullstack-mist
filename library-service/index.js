const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "Bienvenue sur le Library Service!"});
})

app.listen(3002, () => {
    console.log('Library service running on port 3001');
})