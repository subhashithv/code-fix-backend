const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const Project = require('../models/project');
const { GeminiClient } = require('../utils/geminiClient');

const REPOS_DIR = path.join(__dirname, '../repos');

// Clone and Create Project
exports.cloneProject = async (req, res) => {
    const { repoUrl, title, description, tasks = [] } = req.body;

    if (!repoUrl || !title) {
        return res.status(400).json({ error: 'Repository URL and project title are required' });
    }

    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const repoPath = path.join(REPOS_DIR, repoName);

    console.log('Cloning Repo:', repoUrl);
    console.log('Repo Name:', repoName);

    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }

    const git = simpleGit();

    try {
        await git.clone(repoUrl, repoPath);

        const files = [];
        function listFiles(dir) {
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                if (fs.statSync(fullPath).isDirectory()) {
                    listFiles(fullPath);
                } else {
                    files.push(fullPath.replace(repoPath + path.sep, ''));
                }
            }
        }
        listFiles(repoPath);

        // Create project entry in MongoDB
        const project = new Project({
            title,
            description,
            tasks,
            prompt: '',
            response: '',
            tokenCount: 0,
            debuggedResult: '',
            repoName,
            files
        });

        await project.save();

        res.status(200).json({ message: 'Repository cloned and project created successfully', project });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clone repository', details: error.message });
    }
};

// Analyze file content using Gemini
exports.analyzeFile = async (req, res) => {
    const { projectId, filePath } = req.body;

    if (!projectId || !filePath) {
        return res.status(400).json({ error: 'Project ID and file path are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const repoPath = path.join(REPOS_DIR, project.repoName);
    const fullPath = path.join(repoPath, filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `File not found: ${filePath}` });
    }

    try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const prompt = `Act as a code debugger. Analyze the following code for issues and suggest fixes:\n\n${fileContent}`;
        const debuggedResult = await GeminiClient.callGemini(prompt);

        project.debuggedResult = debuggedResult;
        await project.save();

        res.status(200).json({ fileContent, debuggedResult });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze file', details: error.message });
    }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
    }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
    const { id } = req.params;

    try {
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project', details: error.message });
    }
};

// Delete project by ID
exports.deleteProject = async (req, res) => {
    const { id } = req.params;

    try {
        const project = await Project.findByIdAndDelete(id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const repoPath = path.join(REPOS_DIR, project.repoName);
        if (fs.existsSync(repoPath)) {
            fs.rmSync(repoPath, { recursive: true, force: true });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project', details: error.message });
    }
};
