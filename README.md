# PokerPro Tournament Manager

A modern, intuitive tournament management application for poker directors and enthusiasts.

![PokerPro Tournament Manager](public/images/app-screenshot.png)

## Features

- **Beautiful, Apple-inspired UI**: Clean, modern interface with subtle animations and responsive design
- **Tournament Clock**: Professional timer with customizable blind levels and break intervals
- **Player Management**: Track players, assign tables/seats, and manage rebuys/add-ons
- **Table Management**: Automatically balance tables and track eliminations
- **Payout Calculator**: Calculate prize distributions based on configurable structures
- **Tournament Templates**: Pre-configured tournament structures for different formats
- **Blind Structure Editor**: Create and customize blind structures with visual preview
- **Tournament Statistics**: Real-time stats including average stack, remaining players, and prize pool

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/poker-tourney-software.git
   cd poker-tourney-software
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Tournament

1. From the home page, click "Create Tournament"
2. Fill in the tournament details (name, buy-in, starting chips, etc.)
3. Customize the blind structure if needed
4. Click "Create Tournament" to start

### Using Templates

1. Click "Templates" to browse pre-configured tournament structures
2. Select a template that matches your desired format
3. Customize any settings as needed
4. Click "Use Selected Template" to create a tournament with these settings

### Running a Tournament

1. Use the clock controls to start, pause, and navigate between levels
2. Add players through the "Players" tab
3. Manage table assignments in the "Tables" tab
4. Calculate payouts in the "Payouts" tab
5. View tournament statistics and upcoming blind levels

## Technology Stack

- **Framework**: Next.js 14
- **UI**: React, Tailwind CSS, Framer Motion
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with dark mode support
- **Animations**: Framer Motion

## Roadmap

- [ ] User accounts and authentication
- [ ] Cloud synchronization for tournament data
- [ ] Multi-device support for collaborative tournament management
- [ ] Advanced statistics and reporting
- [ ] Tournament history and player profiles
- [ ] Offline mode with local storage
- [ ] Mobile app versions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by professional poker tournament software
- Built with modern web technologies
- Designed for poker enthusiasts and tournament directors
