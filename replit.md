# Overview

This is a full-stack AI-powered productivity and accountability system built with React, Express, and PostgreSQL. The application is laser-focused on SHEER PRODUCTIVITY AND ACCOUNTABILITY - helping users complete tasks and subtasks with mandatory evidence collection. Every task completion requires tangible proof through screenshots, documents, PDFs, emails, call logs, or detailed descriptions. The system enforces strict accountability through evidence validation and rejects generic completion claims.

## Current Status (August 2, 2025)
- ✅ **FRESH START:** System reset with clean database - ready for first-time user experience
- ✅ **PURE PRODUCTIVITY FOCUS:** All revenue tracking completely removed from UI and backend
- ✅ **DAN PENA ACCOUNTABILITY:** AI assistant embodies professional accountability coaching methodology
- ✅ **INTELLIGENT WORKFLOW AUTOMATION:** Evidence analysis creates follow-up tasks automatically
- ✅ **STRICT EVIDENCE VALIDATION:** Zero tolerance for vague responses, demands tangible proof
- ✅ **ENHANCED TASK CREATION:** AI now demands comprehensive details before creating tasks
- ✅ Application fully functional and running on port 5000
- ✅ Database connection established with PostgreSQL via Neon
- ✅ OpenAI API integrated for intelligent task processing
- ✅ All UI components working without errors
- ✅ WebSocket connections established for real-time updates
- ✅ Voice recognition integration with hands-free interaction

## Recent Achievements (August 2, 2025)
- **SYSTEM RESET:** Fresh database for clean first-time user experience - no legacy data
- **REVENUE-FREE INTERFACE:** Completely removed all "$" signs and revenue tracking - pure task focus
- **DAN PENA METHODOLOGY:** AI assistant professionally demands results and eliminates excuses
- **INTELLIGENT FOLLOW-UPS:** Completion evidence like "finalizing tomorrow" automatically creates next-day tasks
- **ENHANCED EVIDENCE VALIDATION:** 75+ character minimum, rejects BS responses with accountability messaging
- **ZERO-TOLERANCE LANGUAGE:** "Results matter, excuses don't" - strict accountability enforcement
- **WORKFLOW AUTOMATION:** AI analyzes evidence to detect dependencies and next steps
- **PROFESSIONAL ACCOUNTABILITY:** System calls out unproductive behavior patterns with precision

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for development and bundling
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **Real-time Communication**: WebSocket connection for live updates and emergency alerts
- **Voice Integration**: Web Speech API for voice recognition and commands

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling and request logging middleware
- **Real-time Features**: WebSocket server for bidirectional communication
- **Development Tools**: Hot module replacement via Vite integration in development mode

## Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database schema migrations and updates

## Data Models
The application manages five core entities:
- **Users**: Authentication and user profile management
- **Clients**: Customer relationship tracking with importance scoring
- **Projects**: Work organization with status tracking and revenue estimation
- **Tasks**: Granular work items with time tracking and revenue impact
- **Messages**: Chat history and AI conversation logging
- **Notifications**: System alerts and user notifications

## AI Integration
- **OpenAI Integration**: GPT-4o model for natural language processing and task assistance
- **Task Intelligence**: Automatic task breakdown, scheduling optimization, and productivity insights
- **Voice Processing**: Speech-to-text conversion for hands-free interaction

## Real-time Features
- **WebSocket Communication**: Live task updates, emergency alerts, and system notifications
- **Voice Commands**: Continuous speech recognition with interim results
- **Quick Actions**: Predefined shortcuts for common task management operations

## Security & Performance
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Validation**: Zod schemas for runtime type checking and API validation
- **Error Handling**: Centralized error processing with proper HTTP status codes
- **Caching**: Intelligent query caching with automatic invalidation strategies

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Environment Configuration**: DATABASE_URL environment variable for connection string

## AI Services  
- **OpenAI API**: GPT-4o model access for natural language processing
- **Environment Configuration**: OPENAI_API_KEY for API authentication

## Development Tools
- **Replit Integration**: Custom plugins for development environment optimization
- **Vite Plugins**: Runtime error overlay and cartographer for enhanced debugging

## UI Framework Dependencies
- **Radix UI**: Comprehensive set of accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent visual elements

## Build and Deployment
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer plugins
- **TypeScript Compiler**: Type checking and compilation orchestration