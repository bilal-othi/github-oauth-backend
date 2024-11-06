const mongoose = require('mongoose');

const GitHubRepoSchema = new mongoose.Schema({
  repoId: String,
  name: String,
  owner: String,
  included: Boolean,
  organizationId: String,
});

module.exports = mongoose.model('GitHubRepo', GitHubRepoSchema);