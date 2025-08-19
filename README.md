# 🤖 Noto: Your AI Notion Assistant

> An AI-powered personal assistant that helps you manage your Notion workspace through natural language commands.

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-FFD21E?style=flat&logoColor=black)](https://huggingface.co/)
[![Notion](https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white)](https://notion.so/)

## 🎯 Project Vision

Noto is an AI-powered assistant that bridges the gap between natural language and your Notion workspace. It helps you manage:

- **📋 Weekly To-Do Lists** - Add, update, and track tasks with natural language
- **💼 Job Application Tracker** - Organize your job hunt efficiently
- **🧠 Smart Interactions** - Powered by Hugging Face LLMs for intelligent command interpretation

## ✨ Key Features (Planned)

- 🗣️ **Natural Language Interface** - "Add task to review PR by tomorrow"
- 📊 **Smart Task Management** - Priority handling, due dates, and status tracking
- 💼 **Job Application Tracking** - From application to offer, track everything
- 🔄 **Real-time Notion Sync** - Changes reflect immediately in your Notion workspace
- 🎯 **CLI First Design** - Terminal interface with future web UI planned

## 🏗️ Architecture Overview

```
[User Input] → [Hugging Face LLM] → [Action Handler] → [Notion API] → [Database]
```

## 🚀 Development Phases

| Phase | Status | Focus |
|-------|--------|--------|
| **Phase 1** | 🔄 In Progress | Project foundation & setup |
| **Phase 2** | 🔜 Planned | Hugging Face command interpreter |
| **Phase 3** | 🔜 Planned | CLI interface development |
| **Phase 4** | 🔜 Planned | Job tracking features |
| **Phase 5** | 🔜 Planned | Web UI or bot interface |
| **Phase 6** | 🔜 Planned | Polish & deployment |

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+ with ES Modules
- **AI**: Hugging Face Transformers with Inference API
- **Database**: Notion API
- **CLI**: Inquirer.js for interactive prompts
- **Utilities**: date-fns, chalk for better UX

## 📋 Prerequisites

- Node.js 16 or higher
- Notion account with integration access
- Hugging Face API key (free tier available)

## ⚡ Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd noto-ai-assistant
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database IDs
   ```

3. **Run Setup (Coming Soon)**
   ```bash
   npm run setup
   ```

4. **Start the Assistant**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Notion Setup
1. Create a new integration at [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Copy the integration token to your `.env` file
3. Create your databases and share them with your integration
4. Copy database IDs to your `.env` file

### Hugging Face Setup
1. Create an account at [huggingface.co](https://huggingface.co/)
2. Get your API key from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. Add it to your `.env` file

## 🎯 Usage Examples (Planned)

```bash
# Task Management
> "Add task to review code by Friday 6 PM"
✅ Task added: Review code (Due: July 11, 2025, 6:00 PM)

# Job Tracking
> "Add Google SWE application with deadline July 15"
💼 Job application added: Google SWE (Deadline: July 15, 2025)

# Status Updates
> "Mark team meeting as completed"
✅ Task completed: Team meeting
```

## 🤝 Contributing

This is a learning project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style
4. Write clear commit messages
5. Submit a pull request

## 📝 Development Principles

- **Modular Design** - Clean separation of concerns
- **Type Safety** - JSDoc comments for better development experience  
- **Error Handling** - Graceful failures with helpful messages
- **Environment-based Config** - No hardcoded secrets
- **Git Best Practices** - Meaningful commits and feature branches

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Current Status:** 🔄 Phase 1 - Project Foundation  
**Next Milestone:** Hugging Face Command Interpreter Implementation  
**Last Updated:** July 5, 2025

*Built with ❤️ as a portfolio project showcasing AI integration, API development, and modern JavaScript practices.*
