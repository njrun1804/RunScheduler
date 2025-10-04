# Run Scheduler 🏃‍♂️

A deterministic weekly training planner for marathon runners, featuring intelligent quality session scheduling around Sunday long runs.

## Features

✅ **Smart Scheduling** - Automatically places quality sessions respecting recovery needs
✅ **Pairwise Spacing** - Checks both left and right neighbors for proper recovery
✅ **Auto-upgrade Logic** - Long Easy becomes Big Easy at 21+ miles
✅ **Visual Week Grid** - Color-coded calendar view with tooltips
✅ **Dark Mode** - Easy on the eyes for early morning planning
✅ **Export to Calendar** - Download ICS files for your calendar app
✅ **Save Plans** - Keep history of your weekly plans

## Quick Start

### Run the Web UI

```bash
# From project root
cd web
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Run Tests

```bash
# From project root
npm test
```

## How It Works

1. **Configure your Sunday long run** - Choose type and distance
2. **Select quality sessions** - Pick from the workout catalog
3. **Get your optimized week** - Algorithm places workouts respecting:
   - Long run recovery buffers (before/after)
   - Lead-in requirements for each quality
   - Spacing between quality sessions
   - Priority based on workout intensity

## The Algorithm

The planner uses a deterministic greedy algorithm with bilateral neighbor checks:

- **Sorts** qualities by weight (intensity), then selection order, then alphabetically
- **Places** each quality on the earliest valid day (Mon→Sat)
- **Validates** lead-in days and spacing to both neighbors
- **Warns** about sessions that couldn't fit

## Quality Session Catalog

Each quality has:
- `before`: Required easy days before
- `after`: Required recovery days after
- `weight`: Priority/intensity level

Examples:
- **Threshold**: 1 before, 1 after, weight 2
- **VO₂ Classic**: 2 before, 2 after, weight 4
- **Steady**: 0 before, 0 after, weight 1

## Long Run Types

- **Easy** (1/1): Standard aerobic long run
- **Progressive** (2/2): With faster finish
- **Hilly** (2/2): With elevation
- **Big Easy** (2/2): 2h45+ or 22+ miles
- **MP** (2/3): Marathon pace segments

## Development

Built with:
- TypeScript core planner (`src/planner.ts`)
- Next.js 14 UI with Tailwind CSS
- Radix UI for accessible components
- Jest for testing

## License

MIT