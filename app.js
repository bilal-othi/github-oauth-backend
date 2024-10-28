const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const githubRoutes = require('./routes/githubRoutes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/github', githubRoutes);

const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
