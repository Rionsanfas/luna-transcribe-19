import React from "react";
import ReactDOM from "react-dom/client";
import VideoPlayer from "./components/VideoPlayer";

const apiUrl = "https://YOUR-DENO-BACKEND_URL"; // Replace with your backend
const jobId = "YOUR_VIDEO_JOB_ID";               // Replace with actual job ID
const token = "YOUR_USER_JWT";                  // Replace with actual JWT

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <h1>VoiceScript AI - Subtitle Preview</h1>
    <VideoPlayer apiUrl={apiUrl} jobId={jobId} token={token} />
  </React.StrictMode>
);