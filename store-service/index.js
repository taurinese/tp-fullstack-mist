const express = require('express');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({message: "Bienvenue sur le Store Service!"});
})

app.listen(3001, () => {
    console.log('Store service running on port 3001');
})