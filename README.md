# AI Training & Prompt Engineering Platform

## Overview

A monorepo-based platform for AI training, prompt engineering, and evaluation. Built with TypeScript/Node.js for type safety and developer experience across backend, frontend, CLI, and deployment layers.

## Monorepo Structure

```
funfriday/
├── apps/                    # Application packages
│   ├── backend/             # Express REST API server
│   ├── frontend/            # React + TypeScript web app
│   └── cli/                 # Node.js CLI tool
├── packages/                # Shared libraries
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Shared utility functions
│   └── config/              # Shared configuration
├── training/                # Training pipeline modules
│   ├── src/data/            # Data loading and preprocessing
│   ├── src/model/           # Model definitions and training
│   └── src/evaluation/      # Model evaluation metrics
├── prompts/                 # Prompt management system
│   ├── src/versioning/      # Prompt versioning logic
│   ├── src/templates/       # Prompt template management
│   └── src/abTesting/       # A/B testing framework
├── api/                     # API layer
│   ├── src/rest/            # REST API implementation
│   └── src/grpc/            # gRPC service definitions
├── deploy/                  # Deployment configuration
│   ├── docker/              # Docker build files
│   ├── k8s/                 # Kubernetes manifests
│   └── ci/                  # CI/CD configuration
└── package.json             # Root package.json (workspaces)
```

## Getting Started

### Prerequisites

- Node.js >= 20.x
- pnpm >= 9.x (recommended) or npm >= 10.x
- Docker (for containerized deployment)
- Kubernetes CLI (kubectl) - optional, for local dev cluster

### Initial Setup

```bash
# Clone the repository
git clone <repo-url> funfriday
cd funfriday

# Install dependencies using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Build all packages
pnpm build

# Run backend development server
pnpm dev:backend

# Run frontend development server
pnpm dev:frontend

# Run CLI
pnpm cli
```

## License

MIT
