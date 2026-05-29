# AuraBeat 🎵
### Context-Aware Music Recommendation & Intelligent Audio Curation

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web-brightgreen?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Node.js-009688?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash-FF6F00?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Video-YouTube%20API-FFCA28?style=for-the-badge&logo=youtube&logoColor=white" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3776AB?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Built%20with-Google%20Antigravity-34A853?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

---

AuraBeat is a premium, AI-driven music curation platform that translates your current mood and environment into the perfect auditory experience. By blending real-time sentiment analysis, local weather data, and Google's Gemini AI, AuraBeat delivers a personalized soundscape that matches your exact vibe, complete with dynamic aesthetic adaptations.

---

## 📸 Visual Walkthrough

### 1. Initial State: Discover Your Vibe
*Enter your mood to begin the AI journey. The dynamic glassmorphic interface awaits your input.*

<!-- SCREENSHOT_BEFORE_VIDEO -->
![Initial UI](./assets/screenshots/initial-ui.png)
<!-- Leave space for: Screenshot of the application before any mood is entered -->

### 2. Result State: Immersive Experience
*After analyzing your mood and local weather, the AI recommends a song, updates the color palette, and loads the official video player.*

<!-- SCREENSHOT_AFTER_VIDEO -->
![Result UI](./assets/screenshots/result-ui.png)
<!-- Leave space for: Screenshot of the application after a song is recommended and the video player is active -->

---

## 💻 Tech Stack

**Frontend (React & Vite)**
* **Framework:** React 18
* **Styling:** Tailwind CSS, Framer Motion
* **Build Tool:** Vite
* **Icons:** Lucide React

**Backend (Node.js API)**
* **Framework:** Express.js
* **API Management:** Axios
* **Security:** Dotenv

**AI & Cloud Services**
* **AI Engine:** Google Gemini 2.5 Flash
* **Video Content:** YouTube Data API v3
* **Environmental Data:** Open-Meteo API
* **Geocoding:** Nominatim (OpenStreetMap)

---

## 🌐 System Architecture & Orchestration

AuraBeat utilizes a distinct separation between client-side responsiveness and server-side AI processing to ensure smooth UI animations alongside complex LLM analysis.

### System Diagram

```mermaid
graph TD
    %% Client Layer
    subgraph Client [Client Layer]
        A["React Frontend \n (Framer Motion)"]
        M["YouTube Embed Player"]
        Geo["Browser Geolocation"]
        A <--> M
        A <--> Geo
    end

    %% Cloud/API Layer
    subgraph Backend [Node + Express Backend]
        B["API Gateway / Router"]
        
        subgraph Agents [AI & Context Pipeline]
            C1["1. Environmental Context"]
            C2["2. Sentiment Analysis"]
            C3["3. Curation Engine"]
            C1 --> C2 --> C3
        end
        
        B <--> Agents
    end

    %% Inference Layer
    subgraph Inference [External Services]
        D["Gemini 2.5 Flash \n (AI Logic)"]
        E["YouTube API \n (Video Search)"]
        F["Open-Meteo \n (Weather Data)"]
    end

    %% Connections
    A <-->|POST Request| B
    
    Agents <--> D
    Agents <--> E
    Agents <--> F
    
    B -->|JSON Payload| A
```

### Why the Ecosystem Modules Exist Separately

**`frontend/` — React SPA Canvas**
Built as a highly responsive single-page application utilizing Framer Motion. This ensures that the dynamic color palette shifts and complex visual feedback happen instantly without page reloads, providing a premium, native-feeling user experience.

**`backend/` — Node.js AI Engine**
Acts as the central orchestrator. It securely manages API keys (preventing exposure on the client) and handles the potentially heavy blocking calls to Gemini and third-party APIs asynchronously.

### How the Components Are Connected

**Data Flow & REST Actions:** The frontend captures the user's string input and local geocoordinates, dispatching them to the backend via a structured REST protocol. 

**Context Integration:** The backend simultaneously fetches weather constraints and feeds them alongside the sentiment data into the Gemini prompt. 

**Aesthetic Translation:** Gemini's response includes not just song recommendations, but explicit JSON aesthetic targets (color codes). The frontend maps these targets directly into the DOM using dynamic Tailwind injection, completing the cycle.

---

## 🤖 Context-Aware AI Pipeline

The application utilizes a multi-stage approach to refine raw user emotion into a tangible multimedia response.

| Stage | Responsibility |
|-------|----------------|
| 1. **Environmental Ingestion** | Resolves raw GPS coordinates into human-readable locations and fetches current weather state constraints. |
| 2. **Sentiment Translation** | Gemini processes the user's prompt string to infer mood, tempo desires, and lyrical needs. |
| 3. **Curation Engine** | Cross-references the sentiment against the environmental baseline to suggest an optimal track and matching color hex schema. |
| 4. **Execution & Retrieval** | Interrogates the YouTube Data API to find the exact official video for the curated track. |

---

## 🛠️ Third-Party Integration Stack

| Service | Purpose |
|---------|---------|
| **Gemini 2.5 Flash API** | Advanced sentiment reasoning, song selection, and color theory formulation. |
| **YouTube Data API v3** | Accurate retrieval of official music videos and audio tracks. |
| **Open-Meteo API** | Live weather analytics without API key constraints. |
| **Nominatim API** | Reverse geocoding of browser coordinates. |

---

## 📁 Project Directory Map

```text
aurabeat-root/
├── backend/                      # Production API Environment
│   ├── scripts/                  # Utility & Debug routines
│   ├── server.js                 # API Core & Gateway routing
│   └── package.json
├── frontend/                     # Client Canvas Application
│   ├── src/                      # UI Components & Framer Motion logic
│   ├── public/                   # Static binary assets
│   └── package.json
├── README.md                     # Master Documentation
└── LICENSE                       # MIT License
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+)
* NPM or Yarn
* API Keys: [Google AI Studio (Gemini)](https://aistudio.google.com/) and [Google Cloud Console (YouTube)](https://console.cloud.google.com/).

### 2. Environment Setup
Create a `.env` file in the `/backend` directory:
```env
GEMINI_API_KEY=your_gemini_key_here
YOUTUBE_API_KEY=your_youtube_key_here
```

### 3. Installation & Launch

**Run Backend:**
```bash
cd backend
npm install
npm start
```

**Run Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

<p align="center">Made with ❤️ for <strong>Music Lovers Everywhere</strong></p>

---

## 📄 License

<details>
<summary>MIT License — click to expand</summary>

```
MIT License

Copyright (c) 2026 AuraBeat

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>
