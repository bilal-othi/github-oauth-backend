const axios = require('axios');
const Integration = require('../models/Integration');

// Step 1: Redirect to GitHub for OAuth login
exports.githubLogin = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`;
  res.redirect(githubAuthUrl);
};


// Step 2: Handle GitHub OAuth callback and store user details
exports.githubCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { login, id, avatar_url, created_at } = userResponse.data;
    // Save to DB
    const integration = new Integration({
      userId: id,
      username: login,
      avatar: avatar_url,
      connectedAt: new Date(created_at),
      accessToken,
    });

    await integration.save();
    res.redirect('http://localhost:4200');
  } catch (error) {
    res.status(500).json({ error: 'GitHub authentication failed' });
  }
};


// Step 3: GitHub Status API - Check if the user has an active integration
exports.githubStatus = async (req, res) => {
  try {
    const { username } = req.params;
    console.log('username ;::::::::::::::::::: ' + username); 
    const integration = await Integration.findOne({ username });

    console.log('integration found : ' + integration);
    if (integration) {
      res.status(200).json({
        username: integration.username,
        connectedAt: integration.connectedAt,
        avatar: integration.avatar,
        message: 'GitHub integration is active',
      });
    } else {
      res.status(404).json({ message: 'No active GitHub integration found' });
    }
  } catch (error) {
    console.error('Error fetching GitHub status:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub status' });
  }
};

// Step 4: Remove integration from the database
exports.removeIntegration = async (req, res) => {
  const { username } = req.params;
  try {
    await Integration.findOneAndDelete({ username });
    res.status(200).json({ message: 'Integration removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove integration' });
  }
};
