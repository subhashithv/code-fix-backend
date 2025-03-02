const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    tasks: Array,
    prompt: String,
    response: String,
    tokenCount: Number,
    debuggedResult: String,
    repoName: String,     // NEW: to store repo folder name
    files: [String]       // NEW: list of all files in repo
});

module.exports = mongoose.model('Project', projectSchema);
