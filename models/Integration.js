const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: String,
  username: String,
  avatar: String,
  connectedAt: Date,
  accessToken: String,
}, {collection: 'integrations'});

module.exports = mongoose.model('Integration', integrationSchema);
