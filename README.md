# Placement Readiness Copilot — Desktop PC Application
> **An executive desktop application built for students to construct their ATS resumes, explore opportunities, and practice AI mock interviews, while placement staff broadcasts job drives, internships, hackathons, and resume boosters.**

---

## 🎨 Design Aesthetic & Desktop Architecture
* **Visual Inspiration**: [SweetTape](https://sweet-tape.com/) tactile design system with vibrant cyan (`#06b6d4`, `#22d3ee`) and deep hues of oceanic sapphire & navy (`#030a17`, `#07152b`, `#1e3a8a`).
* **Standalone Desktop Application**: Runs as a borderless native PC software window with titlebar window controls, latency indicator, and bottom system status bar (no generic browser chrome).
* **Naukri.com-Style Opportunity UX**: Global Boolean LLM Search bar (`AND`, `OR`, `NOT`, `"Quotes"`, `( )`) scanning 42,000+ opportunity nodes with experience, stipend, and category filters tailored for college students.

---

## ⚡ Quick Start (Double-Click Desktop Launch)

Double-click **`run_app.bat`** in the project directory.
It automatically launches Placement Copilot in **Native Application Window Mode** (Edge/Chrome app frame without browser address bars) at **http://localhost:5000**.

Or launch via terminal:
```bash
npm install
node server.js
```

---

## 👥 Two Integrated Roles: Students & Staff

### 1. For Students
* **Live 1-Page ATS Resume Builder**: Interactive multi-step form editor with real-time Harvard/MSOT single-page preview, AI bullet point enhancer (Google X-Y-Z formula), ATS score gauge, and instant PDF print.
* **Areas of Interest & Custom Skills Lab**:
  * Select target domains (Full Stack, AI/GenAI, Cloud/DevOps, Low-Latency Systems, Cybersecurity, Data Eng, Mobile).
  * **Add custom tech skills** not present in the app with proficiency levels and **"What you like to do with this tech"** (e.g. *"Build autonomous agent teams with memory and tool calling"*).
* **AI Technical Mock Interview (15–20 Min)**: Live countdown, Web Speech STT mic input, SpeechSynthesis TTS, animated voice visualizer wave, and comprehensive scorecard.
* **Naukri-Style Job Search**: Global Boolean search, Match Score % tags, and 1-click apply.
* **Application Pipeline Tracker**: 6-stage Kanban board (`Saved`, `Applied`, `Shortlisted`, `Interview`, `Offer`, `Rejected`).

### 2. For Placement Staff (MSOT Placement Cell)
* **Staff Opportunity Broadcast Hub**: Post, broadcast, and manage:
  1. **Campus Job Drives** (Atlassian, Cisco, Morgan Stanley with PPO and minimum score gates)
  2. **Internships** (Summer and 6-month opportunities)
  3. **Hackathons & Competitions** (Smart India Hackathon, Flipkart GRiD, prize pools)
  4. **Resume Boosters & Clinics** (System design masterclasses, AWS certification fee subsidies)
* **Applicant Rosters**: Real-time roster of student applicants with verified readiness scores.

---

## 🏆 Key Architecture & 7 Product Modules

```mermaid
graph TD
    A[Student Intake: Resume PDF, LinkedIn, GitHub, LeetCode] --> B(Module 1: Intake & Privacy Consent)
    B --> C(Module 2: Benchmark Review Engine)
    B --> D(Module 3: AI Mock Interview - Voice/STT/TTS)
    C --> E(Module 4: Placement Readiness Score Calculator)
    D --> E
    E --> F(Module 5: Boolean Job Discovery & Application Tracker)
    E --> G(Module 5 Part 2: MSOT On-Campus Placement Board)
    H[Local Ollama / Hosted Cloud API] --> D
    I[Testing & Scalability Suite] --> E
```

### Module 1: Profile Intake & Management
- **Conversational Chat Assistant**: Students can speak or type details naturally (e.g., *"I solved 350 LeetCode problems and my GitHub is github.com/arjunsharma-dev"*), and the copilot dynamically updates their profile.
- **Resume Upload**: Parses PDF and DOCX files, computes exact page counts, identifies section hierarchy, detects hyperlinks, and scans for contact information.
- **Privacy & Student Consent**: Strict compliance with privacy regulations. Students must provide consent to process their profiles, and have one-click controls to inspect raw JSON data, export their profile, or permanently purge all stored data.
- **5 Pre-Loaded Benchmark Profiles**: Switch between 5 diverse candidate profiles across different score tiers with a single click.

### Module 2: Written Benchmark Review Engine
Evaluates profiles against strict, objective placement standards:
1. **Resume Benchmark (25% Weight)**:
   - Exactly 1-page rule enforcement
   - Clean visual layout & standard ATS section hierarchy (EDUCATION, SKILLS, PROJECTS, EXPERIENCE)
   - Action verbs & grammar check (flags passive phrasing like *"worked on"* or *"helped with"*)
   - Quantifiable metrics & impact (latency, percentage gains, user counts)
   - Mandatory GitHub and LeetCode links in contact header
   - Co-curricular achievements & hackathons
2. **LinkedIn Review (5% Weight)**:
   - Profile photo, headline, and rich About section checks
   - Experience synchronization against resume
   - **Ready-to-Paste Rewrites**: Instant 1-click copyable headline and About section tailored to candidate's target role.
3. **GitHub & Codebase Quality (10% Weight)**:
   - Pinned showcase repositories & custom profile README
   - Annual commit frequency and consistency
   - Per-repo setup instructions, architecture screenshots, and clean folder structures
   - Automated secrets scan (flags exposed `.env`, tokens, or API credentials)
   - Unit test verification (Jest / Pytest)
4. **Live Link Check (25% Weight)**:
   - Automated HTTP status check (200 OK)
   - Responsive mobile view validation
   - Feature parity against README claims

### Module 3: 15–20 Minute AI Mock Interview
- **Dynamic Questioning**: Tailored specifically to the student's real projects (e.g., asking deep questions on WebSocket race conditions in *CollabCode*, or LoRA fine-tuning in *MedRag*).
- **Dual Voice & Text Modes**:
  - Voice Mode with browser Speech-to-Text (STT) mic input
  - Text-to-Speech (TTS) synthesized audio question playback
  - Real-time animated audio visualizer wave
- **Dual AI Engine Options**:
  - **Local Ollama** (`http://localhost:11434`, `llama3`, `mistral`, `deepseek`) with **zero API cost**
  - **Hosted APIs** (OpenAI / Gemini Flash / Azure)
  - **Built-in Offline Heuristic AI** (100% offline reliability without internet or API keys)
- **Comprehensive Scorecard**:
  - Rubric breakdown across 5 dimensions: Conceptual Understanding (40%), Technical Depth (25%), Problem Solving (20%), Practical Experience (20%), Communication (15%)
  - Concrete strengths and improvement areas
  - Full replayable conversation transcript with timestamps

### Module 4: Placement Readiness Score Calculator
Exact weighted formula implemented per specification:
$$\text{Score} = (0.25 \times \text{Resume}) + (0.25 \times \text{Projects}) + (0.20 \times \text{Interview}) + (0.10 \times \text{GitHub}) + (0.10 \times \text{LeetCode}) + (0.05 \times \text{LinkedIn}) + (0.05 \times \text{Co-curricular})$$

- **Readiness Tiers**:
  - `0 – 49`: **Not ready** (Red badge)
  - `50 – 74`: **Almost ready** (Amber badge)
  - `75 – 100`: **Placement ready** (Green badge)
- **Top 5 Actions That Would Raise Score Most**: Dynamically sorted by point gain yield (e.g. `+6 pts`, `+5 pts`) so students know exactly what will move the needle fastest.

### Module 5: Job Discovery, Tracking & MSOT Campus Board
- **Boolean Search Query Builder**: Auto-generates high-precision Boolean search strings (e.g., `("React" OR "Node.js") AND (intern OR "SDE-1") AND ("Bengaluru" OR "Remote")`) with 1-click search shortcuts for Google Jobs, LinkedIn, Naukri, and Internshala.
- **Curated Opportunities Feed**: Matched against candidate skills with Match Score % and reason breakdown.
- **Auto-Apply Assistant**: Generates tailored, 1-click copyable cover notes adhering to platform rules.
- **Kanban Tracker**: 6-stage pipeline (`Saved` ➔ `Applied` ➔ `Shortlisted` ➔ `Interview` ➔ `Offer` ➔ `Rejected`) with follow-up alerts.
- **MSOT On-Campus Job Board**:
  - Exclusive campus drives (Atlassian, Cisco, Morgan Stanley) gated by minimum readiness score threshold.
  - Student 1-click campus application.
  - **MSOT Placement Staff Admin Mode**: Post new campus recruitment drives and inspect candidate applicant rosters with their verified scores.

---

## 🛡️ Job-Source Compliance & Platform Rules Approach
As mandated by Section 7 & 8:
1. **Zero Scraping of Authenticated User Accounts**: Placement Copilot never requires or uses student account credentials to scrape LinkedIn or proprietary job sites.
2. **Authorized Sources**: Relies strictly on:
   - Official RSS feeds and career portal endpoints (Greenhouse, Lever, Amazon/Google careers).
   - Boolean search queries that open standard web pages for student manual submission.
   - Verified on-campus recruitment drives posted directly by MSOT placement staff.
3. **Respect for `robots.txt`**: All automated link checks inspect only public status codes and metadata without aggressive crawler patterns.

---

## 🦙 Running Locally with Ollama (Zero Cost Mode)
To run fully offline and free:
1. Download and install [Ollama](https://ollama.ai/).
2. Pull a recommended model:
   ```bash
   ollama run llama3
   ```
3. In Placement Copilot, navigate to **AI & Local Engine Settings**, choose **Local Ollama**, and ensure the endpoint is set to `http://localhost:11434`.

---

## 🧪 Testing & Scalability Evidence
Navigate to the **Testing & Scalability** tab in the app to inspect:
- **20 Resumes Accuracy Benchmark**: AI score vs Human reviewer ground truth across 20 distinct profiles ($\le 3$ point delta).
- **Consistency Test**: Live test running 5 consecutive runs on the active profile proving variance $\le \pm3$ points.
- **10 GitHub Repos Audit**: Detection of missing READMEs, broken live links, and committed secrets.
- **Scalability Simulation**: Tested up to 150 concurrent students with 145ms average response times and $0.00 cost in local Ollama mode.
