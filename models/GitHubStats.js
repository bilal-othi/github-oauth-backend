const mongoose = require('mongoose');

const GitHubStatsSchema = new mongoose.Schema({
  username: String,
  totalCommits: Number,
  totalPullRequests: Number,
  totalIssues: Number,
});

module.exports = mongoose.model('GitHubStats', GitHubStatsSchema);