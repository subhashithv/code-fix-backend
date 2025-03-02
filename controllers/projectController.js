const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { GeminiClient } = require('../utils/geminiClient');

const REPOS_DIR = path.join(__dirname, '../repos');

// Clone repository
exports.cloneRepo = async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ error: 'Repository URL is required' });
    }

    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const repoPath = path.join(REPOS_DIR, repoName);

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
        res.status(200).json({ message: 'Repository cloned successfully', files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clone repository', details: error.message });
    }
};

// Get file content
exports.getFileContent = async (req, res) => {
    const { repoName, filePath } = req.body;

    if (!repoName || !filePath) {
        return res.status(400).json({ error: 'Repository name and file path are required' });
    }

    const fullPath = path.join(REPOS_DIR, repoName, filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    try {
        const content = fs.readFileSync(fullPath, 'utf8');
        res.status(200).json({ content });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read file', details: error.message });
    }
};

// Debug file content using Gemini
exports.debugFile = async (req, res) => {
    const { fileContent } = req.body;

    if (!fileContent) {
        return res.status(400).json({ error: 'File content is required for debugging' });
    }

    const prompt = `Act as a code debugger. Analyze the following code for issues and suggest fixes. Code: ${fileContent}`;

    try {
        const debuggedResult = await GeminiClient.callGemini(prompt);
        res.status(200).json({ debuggedResult });
    } catch (error) {
        res.status(500).json({ error: 'Failed to debug file', details: error.message });
    }
};

// Combined analyze file (fetch + debug automatically)
exports.analyzeFile = async (req, res) => {
    const { repoName, filePath } = req.body;

    if (!repoName || !filePath) {
        return res.status(400).json({ error: 'Repository name and file path are required' });
    }

    const fullPath = path.join(REPOS_DIR, repoName, filePath);

    if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `File not found at path: ${fullPath}` });
    }

    try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const prompt = `Act as a code debugger. Analyze the following code for issues and suggest fixes. Code: ${fileContent}`;
        const debuggedResult = await GeminiClient.callGemini(prompt);

        res.status(200).json({ fileContent, debuggedResult });
    } catch (error) {
        res.status(500).json({ error: 'Failed to analyze file', details: error.message });
    }
};
// Get all cloned repositories (projects)
exports.getAllProjects = async (req, res) => {
    try {
        if (!fs.existsSync(REPOS_DIR)) {
            return res.status(200).json({ projects: [] });
        }

        const projects = fs.readdirSync(REPOS_DIR)
            .filter(file => fs.statSync(path.join(REPOS_DIR, file)).isDirectory());

        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
    }
};
// Delete a specific project (repository)
exports.deleteProject = async (req, res) => {
    const { repoName } = req.body;

    if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
    }

    const repoPath = path.join(REPOS_DIR, repoName);

    if (!fs.existsSync(repoPath)) {
        return res.status(404).json({ error: 'Repository not found' });
    }

    try {
        fs.rmSync(repoPath, { recursive: true, force: true });
        res.status(200).json({ message: `Repository '${repoName}' deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project', details: error.message });
    }
};
