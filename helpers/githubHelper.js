const axios = require('axios');

exports.getGitHubAccessToken = async (code) => {
    console.log("code --------------> " + code); 
  const response = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    {
      headers: { Accept: 'application/json' },
    }
  );
  return response.data.access_token;
};