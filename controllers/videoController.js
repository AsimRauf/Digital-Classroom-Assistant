// controllers/transcriptionController.js
const { exec } = require('child_process');
const path = require('path');

// Transcribe audio file
const transcribeAudio = (req, res) => {
    const audioFilePath = req.file.path; // Get the path of the uploaded file
    const language = req.body.language || 'english'; // Get the language parameter (default is English)

    exec(`python transcribe.py ${audioFilePath} ${language}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Transcription failed' });
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Transcription failed' });
        }

        res.json({ transcription: stdout });
    });
};

module.exports = { transcribeAudio };
