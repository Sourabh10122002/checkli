# Checkli Client

A modern, functional Checkli built with React and TypeScript. This application allows users to create, manage, and persist checklists for multiple days.

## Features

- **Checklist Builder**: Create, edit, delete, and toggle checklist items dynamically.
- **Daily Checklists**: Manage different checklists for specific dates using an integrated calendar.
- **Data Persistence**: All data is saved to local storage, ensuring your checklists are preserved across sessions.
- **Responsive Design**: Clean and functional UI.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Date Handling**: date-fns
- **Styling**: Vanilla CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd checkli/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

To create a production build:
```bash
npm run build
```

The output will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Calendar.tsx     # Calendar component for date selection
│   └── ChecklistBuilder.tsx # Core checklist management UI
├── types.ts             # TypeScript definitions
├── App.tsx              # Main application layout and logic
├── main.tsx             # Entry point
└── index.css            # Global styles
```
