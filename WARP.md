# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

UHO: Fate of the Grid is a Finnish grid-based life simulation game built with TypeScript, Vite, and HTML Canvas. It's a dark sandbox life simulator set in fictional Finland featuring substance mechanics, law enforcement, economy, and survival elements. The game is completely in Finnish and designed as a single-player sandbox that doesn't require a backend server.

## Development Commands

### Core Development
```powershell
# Install dependencies
npm install
# or
pnpm install

# Start development server (opens at localhost:3000)
npm run dev
# or
pnpm dev

# Build for production
npm run build
# or
pnpm build

# Preview production build
npm run preview
# or
pnpm preview
```

### Testing
```powershell
# Run tests
npm run test
# or
pnpm test

# Run tests with UI
npm run test:ui
# or
pnpm test:ui
```

### Quick Testing
- Open `test.html` directly in browser for a simplified version without TypeScript compilation
- Useful for testing basic game mechanics when having dependency issues

### TypeScript
- All source code uses TypeScript with strict settings
- Build process: `tsc && vite build`
- Uses modern ES2022 target with ESNext modules

## Architecture Overview

### ECS (Entity-Component-System) Pattern
The game is built using a custom ECS architecture located in `/core/`:

**Core ECS Classes:**
- `Entity`: Basic game object with unique ID
- `Component`: Base class for all components (data containers)
- `ComponentManager`: Manages component storage and retrieval
- `System`: Base class for game logic processors
- `World`: Orchestrates entities, components, and systems

### Directory Structure
```
core/           # Engine code (ECS framework)
├── ecs.ts      # Core ECS classes
├── components.ts # All game components
├── systems.ts  # All game systems
└── types.ts    # TypeScript type definitions

src/            # Game implementation
├── main.ts     # Entry point
└── game.ts     # Main game class

data/           # Game content
└── drugs.ts    # Drug definitions with effects

index.html      # Main game HTML
test.html       # Standalone test version
```

### Key Components
- **Transform**: Position and facing direction
- **Sprite**: Visual representation
- **Stats**: 15 character attributes (Strength, Intelligence, etc.)
- **Needs**: 7 survival needs (Hunger, Thirst, Sleep, etc.)
- **Inventory**: Item storage with capacity limits
- **Wallet**: Cash, bank account, debt management
- **Addiction**: Substance dependencies and tolerance
- **Skills**: 11 learnable abilities
- **AI**: NPC behavior state
- **Vehicle**: Transportation mechanics
- **LawEnforcement**: Heat/wanted system
- **QuestFlag**: Game progression tracking

### Key Systems
- **MovementSystem**: Grid-based movement and vehicle fuel consumption
- **CollisionSystem**: Boundary checking
- **NeedsSystem**: Survival need decay over time
- **AddictionSystem**: Drug effects, tolerance, withdrawal
- **PoliceAISystem**: Law enforcement AI behavior
- **VehicleSystem**: Vehicle fuel and driver management  
- **EconomySystem**: Interest on debt/bank accounts
- **CombatSystem**: Turn-based fighting mechanics
- **SaveLoadSystem**: Game state persistence to localStorage

### Path Aliases
- `@/*` → `src/*`
- `@core/*` → `core/*`  
- `@data/*` → `data/*`

### Game Mechanics Specifics

**Turn-Based Grid System:**
- 80x60 grid world with 8px tiles
- Player moves one tile per turn
- All actions consume a turn and trigger need decay

**Survival Needs Decay Rates (per second):**
- Hunger: -0.2, Thirst: -0.3, Sleep: -0.1
- Warmth: -0.05, Social: -0.02, Hygiene: -0.1
- Pain naturally decreases: +0.1

**Drug System:**
9 substances with realistic Finnish names (Alkoholi, Kannabis, etc.) each having:
- Immediate stat/need effects
- Tolerance building (0.001-0.04 per use)
- Addiction risk (0.001-0.03 per use)  
- Overdose risk (0.001-0.015 per use)
- Withdrawal symptoms
- Duration in game time units

**Law Enforcement:**
- Heat system (0-100 scale, wanted at >50)
- Police NPCs patrol and pursue based on heat and proximity
- Simple AI states: idle, suspicious, pursuing

## Development Guidelines

### Code Style
- Uses strict TypeScript with `exactOptionalPropertyTypes`
- All text strings are in Finnish
- Component-based architecture - keep data in components, logic in systems
- Turn-based mechanics - all actions should call `processTurn()`

### Key Patterns
1. **Component Creation**: Always use `ComponentManager.addComponent()`
2. **Entity Queries**: Use `System.getEntitiesWithComponents()` for entity filtering
3. **Stat Modifications**: Always use `modifyStat()`/`modifyNeed()` methods (auto-clamps 0-100)
4. **Message System**: Use `addMessage()` with appropriate type ('normal', 'system', 'combat', 'drug', 'police')

### Finnish Localization
- All UI text, messages, and content is in Finnish
- Drug names use real Finnish terminology
- Stat names have Finnish translations in `translateStat()`/`translateNeed()`

### Testing
- Uses Vitest for testing framework
- Test environment configured for jsdom
- Test files should be in `tests/` directory

### Build Configuration
- Vite with TypeScript
- Development server on port 3000 with auto-open
- Source maps enabled for debugging
- ES2022 target for modern browser compatibility

## Canvas Rendering
- Uses HTML5 Canvas 2D context
- Pixel art style with `imageSmoothingEnabled: false`
- 8x8 pixel tile rendering scaled appropriately
- Simple grid-based graphics (no sprite sheets currently)

## Save System
Uses localStorage with JSON serialization:
- Save slots 1-3 available
- Saves player stats, needs, inventory, location, addictions, and timestamps
- `SaveLoadSystem` handles all persistence operations

## Modding Support
- Content separated in `data/` folder
- Core engine in `core/` folder for reusability
- JSON-based configurations for easy modification
- Designed for sprite replacement and content expansion