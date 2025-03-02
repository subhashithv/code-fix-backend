const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/clone-repo', projectController.cloneRepo);
router.post('/get-file-content', projectController.getFileContent);
router.post('/debug-file', projectController.debugFile);
router.post('/analyze-file', projectController.analyzeFile);   // NEW Combined Route

module.exports = router;
