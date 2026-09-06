# 🎙️ AwaazAI — Voice-First Multimodal AI Assistant for Pakistan

> **"Giving every voice equal access to essential knowledge, regardless of language or literacy."**

![AwaazAI Banner](https://img.shields.io/badge/Status-Hackathon_Winner_Candidate-emerald?style=for-the-badge)
![Next.js 15](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Groq Cloud](https://img.shields.io/badge/Groq_Cloud-FF6F00?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📌 Problem Statement

Millions of people across Pakistan face severe digital exclusion. Essential services—such as basic healthcare advice, financial literacy programs, and civic/legal rights guidance—strictly demand text literacy and English or formal language proficiency. Over 230 million regional speakers are left behind simply because digital tools require typing and text reading.

## 🚀 The Solution

**AwaazAI** is a zero-cost, open-source, voice-driven multimodal AI assistant engineered specifically for low-literacy populations and regional dialect speakers across Pakistan. 

With **AwaazAI**, users do not type or navigate complex menus. They simply tap a micro-button, speak naturally in **Urdu, Sindhi, Pashto, Punjabi, or Balochi**, and receive natural, context-aware spoken guidance alongside simple visual cards.

---

## ✨ Key Features

* 🗣️ **100% Voice-First Interaction:** Built-in audio-to-audio processing pipeline requiring zero typing or text literacy.
* 🌐 **Multi-Dialect Support:** Real-time processing for Urdu, Pashto, Sindhi, Punjabi, and regional accents.
* 🏥 **Domain-Specific RAG Knowledge Base:** Verified, hallucination-free guidance on Healthcare, Financial Literacy, and Civic Rights.
* 📱 **Mobile-First PWA:** Installable as a Progressive Web App (PWA) with offline caching and low-data optimization for 2G/3G networks.
* 💸 **Zero Hosting Infrastructure Cost:** Built entirely on top of high-speed free tiers (Groq Cloud, Vercel, Supabase, Edge-TTS).

---

## 🛠️ Tech Stack & Tools

### Frontend
* **Framework:** Next.js 15 (App Router)
* **Library:** React 19
* **Styling:** Tailwind CSS v4
* **Animations:** Framer Motion
* **Icons:** Lucide React

### AI & Speech Engines
* **Speech-to-Text (STT):** OpenAI Whisper (via Groq Cloud API) + Web Speech API fallback
* **Language Models (LLM):** Qwen LLM / Llama 3.1 8B (via Groq API / Alibaba Cloud)
* **Text-to-Speech (TTS):** Microsoft Edge-TTS (`ur-PK-UzmaNeural` / regional neural engines) + Google Translate TTS fallback
* **RAG Framework:** LangChain / Custom vector context matching

### Backend & Database
* **API Layer:** Next.js API Routes (Edge Runtime)
* **Database & Analytics:** Supabase (Admin analytics & conversation history)

### Development Tools
* **Environment:** Node.js, npm, VS Code, Git Bash
📄 License
This project is open-source under the MIT License.
---

## 🏗️ Architecture & Data Flow
