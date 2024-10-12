const express = require('express');
const multer = require('multer');
const videoController = require('../controllers/videoController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Directory to save uploaded files

// Route to upload video
router.post('/upload', upload.single('video'), videoController.transcribeVideo);

module.exports = router;
