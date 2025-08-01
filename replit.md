# Overview

This is a full-stack AI-powered personal assistant application built with React, Express, and PostgreSQL. The application serves as an intelligent task management and productivity platform that provides real-time assistance through voice commands, chat interface, and smart scheduling capabilities. It features multiple view modes including chat, calendar, timeline, and cash flow visualizations to help users manage their work and revenue streams effectively.

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