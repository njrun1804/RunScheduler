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

Current catalog:

| Session | Before | After | Weight |
| --- | ---: | ---: | ---: |
| Medium-long easy (90–105′) | 0 | 1 | 1 |
| Threshold (split or 25–40′ continuous) | 1 | 1 | 2 |
| Fartlek / medium hills (e.g., 1′/1′ × 30–40′) | 1 | 1 | 2 |
| VO₂ micro (30/30s, 12–18′ on-time) | 1 | 1 | 2 |
| MP (alternations, ~30–45′ MP total) | 2 | 2 | 4 |
| VO₂ big (e.g., 5×1k or 6×800 @ ~5k) | 2 | 2 | 4 |
| MP big (continuous ≥45′ at MP) | 2 | 3 | 5 |
| Long progression / MP-lite finish (last 15–25′ steady/MP-lite) | 2 | 2 | 4 |

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
