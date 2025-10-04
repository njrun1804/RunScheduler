# Claude Code Assistant Documentation

## Project: RunScheduler - Weekly Training Planner

### Overview
This project implements a deterministic weekly training planner for marathon runners, featuring intelligent quality session scheduling around Sunday-anchored long runs. It was built with Claude Code Assistant to solve the "greedy scheduler bug" by implementing bilateral neighbor spacing checks.

### Architecture

#### Core Components

1. **TypeScript Planner Engine** (`src/planner.ts`)
   - Deterministic scheduling algorithm
   - Bilateral neighbor spacing validation
   - Auto-upgrade logic (Long Easy → Big Easy at 21+ miles)
   - Weight-based priority sorting with stable tiebreakers

2. **Next.js UI** (`web/`)
   - Interactive week calendar grid
   - Real-time schedule updates
   - Dark mode support
   - Export to calendar (ICS)
   - Local storage for saved plans

### Key Algorithm Features

#### The Greedy Bug Fix
The original greedy algorithm only tracked the last placed session, preventing optimal placement when a lighter session could go before a heavier one.

**Solution**: When placing a session on day `d`, check spacing against both:
- **Nearest left** scheduled session
- **Nearest right** scheduled session

This ensures constraint satisfaction for all neighbors, not just chronological order.

#### Scheduling Rules
1. **Sunday is always long run** (no quality sessions)
2. **Long-run buffers** block days before/after based on type:
   - Easy (1/1): Sat before, Mon after
   - Progressive/Hilly/Big (2/2): Fri-Sat before, Mon-Tue after
   - MP (2/3): Fri-Sat before, Mon-Wed after
3. **Per-session lead-in**: Each quality needs X consecutive easy days before
4. **Pairwise spacing**: Between qualities A and B, require sufficient recovery days
5. **Deterministic ordering**: Weight desc → selection index → alphabetical

### Quality Catalog

| Quality Type | Before | After | Weight | Description |
|-------------|--------|-------|---------|-------------|
| Threshold | 1 | 1 | 2 | T reps or ≤30′ continuous |
| Threshold Alternations | 2 | 2 | 4 | 1k T / 1k steady ×4-6 |
| CV / 10k | 1 | 1 | 2 | 4-6×1k at 10k pace |
| VO₂ Micro | 1 | 1 | 2 | 30/30s intervals |
| VO₂ Classic | 2 | 2 | 4 | 5×1k or 6×800 @ 5k |
| Steady | 0 | 0 | 1 | High Z2/low Z3 |

### Test Coverage
25 comprehensive Jest tests covering:
- Long-run blocking patterns
- Lead-in window validation
- Bilateral spacing enforcement
- Auto-upgrade logic
- Determinism verification
- Edge cases (empty selections, unknown keys)

### UI Features

#### Visual Week Grid
- Color-coded days:
  - 🟢 Green: Quality scheduled
  - 🔴 Red: Blocked (recovery)
  - 🟣 Purple: Sunday long run
  - 🔵 Blue: Easy/available
- Hover tooltips with details
- Today indicator

#### Smart Configuration
- Long run type selector with distance slider
- Auto-upgrade warning at 21+ miles
- Visual buffer preview
- Searchable quality selector with intensity badges

#### Training Analytics
- Weekly load calculation
- Motivational quotes based on load
- Session count tracking
- Export to calendar (ICS)
- Save/load previous plans

### Development Setup

```bash
# Install dependencies
npm install
cd web && npm install

# Run tests
npm test

# Start UI
cd web && npm run dev
```

### Technology Stack
- **Core**: TypeScript, Jest
- **UI**: Next.js 14, Tailwind CSS v4, Radix UI
- **State**: React hooks, localStorage
- **Icons**: Lucide React

### File Structure
```
/RunScheduler
├── src/
│   ├── planner.ts        # Core scheduling algorithm
│   └── planner.test.ts   # Comprehensive test suite
├── web/
│   ├── app/
│   │   ├── page.tsx      # Main planner UI
│   │   └── layout.tsx    # App layout with theme
│   ├── components/
│   │   ├── WeekGrid.tsx  # Visual calendar
│   │   ├── QualitySelector.tsx
│   │   ├── LongRunConfig.tsx
│   │   └── PlanSummary.tsx
│   └── lib/
│       └── planner-adapter.ts # Core logic wrapper
├── README.md
├── claude.md (this file)
└── package.json
```

### Claude Code Features Used
- File reading/writing with proper path handling
- TypeScript implementation with strict typing
- Jest test creation and execution
- Next.js project scaffolding
- Git integration for version control
- Background process management for dev server
- Multi-file coordinated changes

### Success Metrics
✅ All 25 tests passing
✅ Deterministic scheduling achieved
✅ Greedy bug fixed with bilateral checks
✅ Full UI implementation with dark mode
✅ Export and save functionality working
✅ Mobile responsive design

### Future Enhancements
- Context-aware adjustments (heat, hills, life stress)
- Alternate week start days (not just Monday)
- Backtracking for maximum session placement
- Integration with training platforms (Strava, TrainingPeaks)
- Historical performance tracking

---

*Built with Claude Code Assistant - Intelligent pair programming for complex software development*