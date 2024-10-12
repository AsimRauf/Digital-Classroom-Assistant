const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const axios = require('axios');
const ytdl = require('ytdl-core');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

// Use environment variables for AssemblyAI API Key and Port
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const PORT = process.env.PORT || 3000;

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    }
});

const upload = multer({ storage });

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files

// Route to handle video URL input and transcription from YouTube
app.post('/api/transcribe-url', async (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Valid YouTube video URL is required' });
    }

    try {
        // Step 1: Download the audio from YouTube
        const audioFilePath = `uploads/${Date.now()}_audio.mp3`;

        const audioStream = ytdl(videoUrl, { filter: 'audioonly' });
        const output = fs.createWriteStream(audioFilePath);

        audioStream.pipe(output);

        output.on('finish', async () => {
            // Step 2: Upload the audio file to AssemblyAI
            const audioData = fs.readFileSync(audioFilePath);
            const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/octet-stream'
                }
            });

            const audioUrl = uploadResponse.data.upload_url;

            // Step 3: Request transcription from AssemblyAI
            const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
                audio_url: audioUrl
            }, {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY
                }
            });

            const transcriptId = transcriptResponse.data.id;

            // Step 4: Poll AssemblyAI for transcription results
            let transcriptionResult;
            while (!transcriptionResult || transcriptionResult.status !== 'completed') {
                const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                    headers: {
                        'authorization': ASSEMBLYAI_API_KEY
                    }
                });

                transcriptionResult = statusResponse.data;

                if (transcriptionResult.status === 'failed') {
                    return res.status(500).json({ error: 'Transcription failed' });
                }

                // Wait before checking again
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Step 5: Return the transcription text
            res.json({ transcription: transcriptionResult.text });

            // Clean up temporary audio file
            fs.unlinkSync(audioFilePath);
        });

        output.on('error', (error) => {
            console.error(`Error writing audio file: ${error.message}`);
            res.status(500).json({ error: 'Audio download failed', details: error.message });
        });

    } catch (err) {
        console.error('ERROR during transcription:', err);
        res.status(500).json({ error: 'Transcription error', details: err.message });
    }
});

// Route to handle manual video upload and transcription
app.post('/api/transcribe', upload.single('video'), (req, res) => {
    const videoFilePath = req.file.path;

    // Extract audio from video
    const audioFilePath = `uploads/${Date.now()}_audio.wav`;
    ffmpeg(videoFilePath)
        .toFormat('wav')
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('start', commandLine => {
            console.log(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', progress => {
            console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
            console.log('Audio extraction finished successfully.');
            try {
                // Step 1: Upload the audio file to AssemblyAI
                const audioData = fs.readFileSync(audioFilePath);
                const response = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
                    headers: {
                        'authorization': ASSEMBLYAI_API_KEY,
                        'content-type': 'application/octet-stream'
                    }
                });

                const audioUrl = response.data.upload_url;
                console.log(`Audio file uploaded to AssemblyAI: ${audioUrl}`);

                // Step 2: Request transcription from AssemblyAI
                const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
                    audio_url: audioUrl
                }, {
                    headers: {
                        'authorization': ASSEMBLYAI_API_KEY
                    }
                });

                const transcriptId = transcriptResponse.data.id;
                console.log(`Transcription started with ID: ${transcriptId}`);

                // Step 3: Poll AssemblyAI for transcription results
                let transcriptionResult;
                while (!transcriptionResult || transcriptionResult.status !== 'completed') {
                    const statusResponse = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                        headers: {
                            'authorization': ASSEMBLYAI_API_KEY
                        }
                    });

                    transcriptionResult = statusResponse.data;
                    console.log(`Transcription status: ${transcriptionResult.status}`);

                    if (transcriptionResult.status === 'failed') {
                        return res.status(500).json({ error: 'Transcription failed' });
                    }

                    // Wait before checking again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }

                // Step 4: Return the transcription text
                res.json({ transcription: transcriptionResult.text });
            } catch (err) {
                console.error('Error during transcription process:', err);
                res.status(500).json({ error: 'Transcription failed', details: err.message });
            } finally {
                // Clean up temporary files
                fs.unlinkSync(videoFilePath);
                fs.unlinkSync(audioFilePath);
            }
        })
        .on('error', (error) => {
            console.error(`FFmpeg Error: ${error.message}`);
            res.status(500).json({ error: 'Audio extraction failed', details: error.message });
        })
        .save(audioFilePath); // Specify the output file here
});

// Basic route to serve the HTML page (if needed)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
