const express = require('express');
const router = express.Router();
const { githubLogin, githubCallback, githubStatus, removeIntegration } = require('../controllers/githubController');

router.get('/login', githubLogin);
router.get('/status/:username', githubStatus);
router.get('/callback', githubCallback);
router.delete('/remove/:username', removeIntegration);

module.exports = router;
