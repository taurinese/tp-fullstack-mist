const express = require('express');
const cookieParser = require('cookie-parser');
const libraryRoutes = require('./routes/library');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/', libraryRoutes);

module.exports = app;
