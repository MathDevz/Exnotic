# Exnotic - YouTube Video Player

## Overview

Exnotic is a clean, minimal YouTube video viewer application that provides an ad-free experience for watching YouTube content. The application allows users to search for videos or paste YouTube URLs directly, displaying results in a distraction-free interface. It's built as a full-stack web application with a React frontend and Express backend, designed to offer a simplified alternative to the standard YouTube interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with a dark theme configuration and CSS variables for theming
- **Routing**: Wouter for lightweight client-side routing with three main routes:
  - Home page (`/`) - Landing page with search functionality
  - Search results (`/search`) - Displays video search results
  - Video player (`/watch/:id`) - Individual video viewing page
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with endpoints for video search and retrieval
- **Development Setup**: Custom Vite integration for development with middleware mode
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Logging**: Custom request logging middleware for API endpoints

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Defined in shared directory for type consistency across frontend and backend
- **Tables**: 
  - `videos` - Stores video metadata (title, description, channel info, thumbnails)
  - `search_queries` - Logs user search queries with timestamps
- **Development Storage**: In-memory storage implementation (`MemStorage`) for development/testing
- **Production Storage**: Database-backed storage with connection pooling via Neon serverless

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Management**: Basic session handling configured via connect-pg-simple for future use
- **Security**: CORS and basic request validation in place

### External Dependencies

#### Core Framework Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for production database connectivity
- **drizzle-orm & drizzle-kit**: Type-safe ORM with migration tooling for PostgreSQL
- **express**: Web application framework for the backend API server
- **react & react-dom**: Core React library for building the user interface
- **@vitejs/plugin-react**: Vite plugin for React development and building

#### UI and Styling Dependencies
- **@radix-ui/***: Complete set of accessible, unstyled UI primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx & tailwind-merge**: Utilities for conditional CSS class handling

#### State Management and Data Fetching
- **@tanstack/react-query**: Server state management with caching, background updates, and request deduplication
- **wouter**: Lightweight React router alternative to React Router
- **react-hook-form & @hookform/resolvers**: Form state management with validation

#### Development and Build Tools
- **typescript**: Static type checking for both frontend and backend
- **vite**: Fast build tool and development server with HMR
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for Node.js development

#### External API Integration
- **YouTube Data API v3**: For searching videos and retrieving video metadata (requires YOUTUBE_API_KEY or GOOGLE_API_KEY environment variable)
- **YouTube oEmbed API**: For additional video information retrieval

#### Utility Dependencies
- **zod**: TypeScript-first schema validation library
- **date-fns**: Date utility library for formatting and manipulation
- **lucide-react**: Icon library with React components
- **nanoid**: Small, URL-safe unique ID generator

## Recent Changes

**September 10, 2025**
- ✅ Enhanced recommendation system with real-time updates after every search
- ✅ Improved recommendation scoring with weighted recent searches for better variety  
- ✅ Fixed dashboard icons to match header (Settings icon) and removed duplicate Clock icons
- ✅ Added BookOpen icon for Watch Later to differentiate from Recently Viewed
- ✅ Added heart and watch later action buttons to all video cards with hover effects
- ✅ Removed three-dot dropdown menu from video cards as requested
- ✅ Added action buttons to search results video cards with proper state management
- ✅ Verified legal pages (privacy policy, terms of service, about) are properly updated
- ✅ Created comprehensive README.md with deployment instructions
- ✅ Confirmed Vercel deployment configuration is ready for production
- ✅ Added data-testid attributes to action buttons for better testing