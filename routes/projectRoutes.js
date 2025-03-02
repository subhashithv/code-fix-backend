const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Project CRUD and Analysis routes
router.post('/clone', projectController.cloneProject);                // Clone repo + create project
router.post('/analyze-file', projectController.analyzeFile);          // Analyze file in project
router.get('/', projectController.getAllProjects);                    // Get all projects
router.get('/:id', projectController.getProjectById);                  // Get project by ID
router.delete('/:id', projectController.deleteProject);                // Delete project by ID

module.exports = router;
