// routes/transcriptionRoutes.js
const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('../controllers/transcriptionController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Set the destination for uploaded files

// Define the transcription route
router.post('/transcribe', upload.single('audio'), transcribeAudio);

module.exports = router;
