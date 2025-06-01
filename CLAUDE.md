# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Call of War Team Strategy Planner - A React-based Gantt chart application for coordinating military strategy in the Call of War game. Currently in initial setup phase with Vite + React + TypeScript template.

## Commands

### Development
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - TypeScript check + production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### Testing
No test framework configured yet. When implementing tests, consider Jest or Vitest for unit tests.

## Architecture

### Tech Stack
- **Framework**: React 18 + TypeScript 5
- **Build Tool**: Vite 6
- **State Management**: Zustand
- **Styling**: Tailwind CSS with custom military theme
- **Drag & Drop**: @dnd-kit (for Gantt chart interactions)
- **Date Handling**: date-fns
- **Icons**: react-icons

### Project Structure
```
src/
├── components/    # UI components (empty - to be implemented)
├── hooks/         # Custom React hooks
├── store/         # Zustand state management
├── types/         # TypeScript type definitions (core domain model)
├── utils/         # Utility functions
└── styles/        # Global styles
```

### Domain Model (from types/index.ts)
The application models a military strategy game with:
- **Units**: Infantry, Armor, Artillery, Air Force, Navy, Support
- **Resources**: Manpower, Oil, Metal, Rare Metals, Money
- **Tasks**: Unit Production, Research, Movement, Attack, Defense, Construction
- **Players**: Commander, Officer, Member roles
- **Research**: Technology tree with prerequisites
- **Strategies**: Complete plans with tasks and assignments

### Key Implementation Notes

1. **State Management**: Use Zustand stores for:
   - Unit production queues
   - Research progress
   - Task dependencies
   - Player assignments
   - Strategy versions

2. **Gantt Chart Implementation**: 
   - Use @dnd-kit for drag-and-drop task management
   - date-fns for all date calculations
   - Consider task dependencies when rendering

3. **TypeScript**: Strict mode is enabled. All components should be properly typed using the interfaces in types/index.ts.

4. **Styling**: Use Tailwind classes. Custom theme includes:
   - Dark mode support (class-based)
   - Military color scheme (cod-primary, cod-accent, etc.)
   - Bebas Neue font for military aesthetic

5. **File Operations**: file-saver is available for exporting strategies.

## Development Guidelines

1. Follow the established type definitions in types/index.ts
2. Use date-fns for all date operations (no native Date manipulation)
3. Implement proper error boundaries for the Gantt chart components
4. Consider performance with React.memo for task list items
5. Use Zustand's subscribe method for cross-store communication