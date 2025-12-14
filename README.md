# Church Scripture Display

A beautiful, full-screen scripture display application designed for church projections. Enter a Bible verse reference, and the app displays it elegantly on screen with easy navigation to show subsequent verses.

## Features

- **Scripture Lookup**: Enter any Bible verse reference (e.g., "John 3:16", "Psalm 23:1-6")
- **Beautiful Display**: Large, readable typography optimized for projection
- **Verse Navigation**: Easily move to next/previous verses with buttons or keyboard
- **Fullscreen Mode**: Hide all UI elements for clean projection display
- **Keyboard Shortcuts**: Control everything without touching the mouse
- **Auto-suggestions**: Book name suggestions while typing
- **Responsive Design**: Works on any screen size

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Enter a Scripture Reference**: Type a verse reference like "John 3:16" or "Romans 8:28-30"
2. **Display**: Click "Display" or press Enter to show the verse
3. **Navigate**: Use the Next/Previous buttons or keyboard shortcuts to move through verses
4. **Fullscreen**: Press F or click the Fullscreen button for projection mode

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `→` or `N` | Next verse |
| `←` or `P` or `Backspace` | Previous verse |
| `F` | Toggle fullscreen |
| `Escape` | Exit fullscreen or return to search |
| `/` or `S` | Open search (from display view) |

## Reference Formats

The app accepts various scripture reference formats:

- `John 3:16` - Single verse
- `Psalm 23:1-6` - Verse range
- `1 Corinthians 13:4` - Books with numbers
- `Rom 8:28` - Abbreviations

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **Bible API** for scripture data (bible-api.com)

## For Church Use

1. Connect your computer to the projector via HDMI
2. Open the app in a web browser
3. Enter the scripture reference
4. Press `F` to enter fullscreen mode
5. Use `Space` or `→` to show the next verse as needed
6. Press `Escape` to exit fullscreen and search for new verses

## License

MIT
