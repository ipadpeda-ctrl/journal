# Trading Journal

## Overview

A professional trading journal web application for tracking trading operations, analyzing performance metrics, and improving trading strategies. The app provides comprehensive trade logging with support for confluences (pro/contro factors), emotional tracking, and detailed statistical analysis through charts and dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom development plugins for Replit integration
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Component Library**: shadcn/ui (Radix UI primitives) with custom styling
- **Charts**: Recharts for data visualization (bar charts, pie charts, line charts)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with `/api` prefix
- **Storage Interface**: Abstracted storage layer (`IStorage`) with in-memory implementation (`MemStorage`), designed for easy database migration

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Migrations**: Drizzle Kit for schema migrations (output to `/migrations`)

### Design System
The application follows a hybrid design approach inspired by Linear, TradingView, and Notion:
- **Typography**: Inter/IBM Plex Sans for UI, IBM Plex Mono for data/numbers
- **Color System**: HSL-based CSS variables with semantic naming
- **Spacing**: Tailwind standardized units (2, 4, 6, 8, 12, 16)
- **Components**: Cards, tables, forms with dense data presentation

### Key Features
- Trade entry form with quick data input
- Operations table with filtering and sorting
- Calendar view for date-based trade visualization
- Statistics dashboard with performance metrics
- Confluence tracking (pro/contro factors per trade)
- Emotional state tracking per trade
- Weekly recap and mood tracker
- Configurable pairs, emotions, and confluence options

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connected via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### UI Libraries
- **Radix UI**: Comprehensive primitive components (dialog, dropdown, popover, tabs, etc.)
- **Recharts**: Data visualization library for charts
- **embla-carousel-react**: Carousel functionality
- **react-day-picker**: Date picker component
- **cmdk**: Command palette component
- **vaul**: Drawer component

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server-side bundling for production
- **tsx**: TypeScript execution for development

### Session & Security
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **passport / passport-local**: Authentication (prepared but not fully implemented)

### Form Handling
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod resolver for form validation