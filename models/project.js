const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    tasks: Array,
    prompt: String,
    response: String,
    tokenCount: Number,
    debuggedResult: String
});

module.exports = mongoose.model('Project', projectSchema);
