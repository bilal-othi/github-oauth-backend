const express = require('express');
const router = express.Router();
const { 
    githubLogin, 
    githubCallback, 
    githubStatus, 
    removeIntegration, 
    fetchOrganizations, 
    fetchRepositories, 
    fetchRepoDetails, 
    fetchOrganizationsAndRepositories
     } = require('../controllers/githubController');


router.get('/login', githubLogin);
router.get('/status/:username', githubStatus);
router.get('/callback', githubCallback);
router.delete('/remove/:username', removeIntegration);

router.get('/organizations', fetchOrganizations);
router.get('/organizations/:orgId/repos', fetchRepositories);
router.get('/repos-all-orgs', fetchOrganizationsAndRepositories);
router.get('/stats/:user/:owner/:repoId', fetchRepoDetails);


// const githubController = require('../controllers/githubController');
// router.get('/login', githubController.githubLogin);
// router.get('/status/:username', githubController.githubStatus);
// router.get('/callback', githubController.githubCallback);
// router.delete('/remove/:username', githubController.removeIntegration);

// // Organization and Repositories Endpoints
// router.get('/organizations', githubController.fetchOrganizations);
// router.get('/organizations/:orgId/repos', githubController.fetchRepositories);
// router.get('/repos/:repoId/details', githubController.fetchRepoDetails);

module.exports = router;
