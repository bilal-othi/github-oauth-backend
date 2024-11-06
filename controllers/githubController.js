const axios = require('axios');
const Integration = require('../models/Integration');
const GitHubRepo = require('../models/GitHubRepo');
const GitHubStats = require('../models/GitHubStats');


// Step 1: Redirect to GitHub for OAuth login
exports.githubLogin = (req, res) => {
  console.log("Inside login-----------------------> "); 
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
    const integration = await Integration.findOne({ username });

    console.log('integration found : ' + integration);
    if (integration) {
      res.status(200).json({
        username: integration.username,
        connectedAt: integration.connectedAt,
        avatar: integration.avatar,
        message: 'GitHub integration is active',
        accessToken: integration.accessToken,
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


// Fetch Organizations
exports.fetchOrganizations = async (req, res) => {

  const accessToken = req.params.token; //req.user.accessToken;
  console.log("access token ----------------_> " + accessToken); 
  try {
    const response = await axios.get('https://api.github.com/user/orgs', {
      headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
    });
    res.json(response.data);
  } catch (error) {
    console.log(JSON.stringify(error)); 
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
};

// Fetch Repositories for each Organization
exports.fetchRepositories = async (req, res) => {
  const orgId = "Test-Org-1111111111"; //req.params;
  //const accessToken = req.user.accessToken;
  try {
    const response = await axios.get(`https://api.github.com/orgs/${orgId}/repos`, {
      headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
    });
    const repos = response.data.map((repo) => ({
      repoId: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      included: false,
      organizationId: orgId,
    }));

    await GitHubRepo.insertMany(repos, { ordered: false });
    res.json(repos);
  } catch (error) {
    console.log(JSON.stringify(error)); 
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
};


// Fetch all organizations and their repositories
exports.fetchOrganizationsAndRepositories = async (req, res) => {
  try {
    // Step 1: Fetch all organizations
    const orgsResponse = await axios.get('https://api.github.com/user/orgs', {
      headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
    });
    const organizations = orgsResponse.data;

    // Step 2: Fetch repositories for each organization in parallel and flatten the result
    const reposPromises = organizations.map(async (org) => {
      try {
        const reposResponse = await axios.get(`https://api.github.com/orgs/${org.login}/repos`, {
          headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
        });

        // Structure each repository with relevant details
        return reposResponse.data.map((repo) => ({
          repoId: repo.id,
          name: repo.name,
          owner: repo.owner.login,
          included: false,
          organizationId: org.id,
          url: repo.html_url,
        }));
      } catch (error) {
        console.error(`Error fetching repositories for org ${org.login}:`, error);
        return []; 
      }
    });

    const allRepos = (await Promise.all(reposPromises)).flat();
    res.json(allRepos);
  } catch (error) {
    console.error("Failed to fetch organizations or repositories:", error); 
    res.status(500).json({ error: 'Failed to fetch all repositories' });
  }
};

// Fetch Commits, Pull Requests, and Issues for Included Repos
exports.fetchRepoDetails = async (req, res) => {
  const { user, owner, repoId } = req.params;

  //const accessToken = req.user.accessToken;
  try {
    let basicAPI = `https://api.github.com/repos/${owner}/${repoId}`; 
    const [commits, pullRequests, issues] = await Promise.all([
      axios.get(`${basicAPI}/commits`, {
        headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
      }),
      axios.get(`${basicAPI}/pulls`, {
        headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
      }),
      axios.get(`${basicAPI}/issues`, {
        headers: { Authorization: `Bearer ${process.env.ACCESS_CODE}` },
      }),
    ]);

    const stats = {
      user: user,
      totalCommits: commits.data.length,
      totalPullRequests: pullRequests.data.length,
      totalIssues: issues.data.length,
    };

    // Save the stats to the database
    await GitHubStats.create(stats);

    // Return the stats as an array
    res.json([stats]);
  } catch (error) {
    console.log(JSON.stringify(error)); 
    res.status(500).json({ error: 'Failed to fetch repo details' });
  }
};