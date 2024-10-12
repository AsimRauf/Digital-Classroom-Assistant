# Video Transcription Tool

A powerful tool for transcribing video and audio files. This application allows users to upload video files or provide a video URL for transcription using AssemblyAI's API. 

## Features Implemented

- **Transcribe Video from URL**: Users can input a video URL, and the application will download the video, extract audio, and return the transcription.
- **Manual Video Upload**: Users can upload video files directly to the application, which extracts audio and provides transcription.
- **Audio Extraction**: FFmpeg is used to extract audio from video files, ensuring high-quality audio for transcription.
- **Polling for Transcription**: The application checks the status of transcription requests at regular intervals to provide updates.

## Future Enhancements

1. **Improved Error Handling**: Enhance error messages and handling throughout the application for better user experience.
2. **User Authentication**: Implement user accounts for saving previous transcriptions and managing uploaded files.
3. **Support for More Audio/Video Formats**: Extend support to additional audio and video formats.
4. **Downloadable Transcription Files**: Allow users to download transcriptions as text files or in other formats (e.g., PDF).
5. **UI Improvements**: Create a more user-friendly web interface using frameworks like React or Vue.js.

## Getting Started

### Prerequisites

To run this project, you will need:

- **Node.js** (v14 or later)
- **npm** (Node package manager)
- **AssemblyAI API Key**: Sign up at [AssemblyAI](https://www.assemblyai.com/) to obtain your API key.
- **FFmpeg**: Ensure FFmpeg is installed and accessible from the command line.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AsimRauf/Digital-Classroom-Assistant
   cd video-transcription-tool
