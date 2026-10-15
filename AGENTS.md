# AGENT.md — Scenora

## 1. Project Overview

Scenora is a cinematic movie discovery website powered by TMDB.

Its purpose is to help users discover movies through trending collections, search, advanced filters, movie details, trailers, recommendations, and a personal watchlist.

### Product principles

- Cinematic and visually distinctive.
- Responsive, accessible, and performant.
- Intuitive discovery experience.
- Consistent design system.
- Maintainable, type-safe code.
- Incremental, verifiable implementation.

Do not turn Scenora into a generic admin dashboard or an imitation of an existing streaming platform.

## 2. Technology Stack

Use the following stack unless the user explicitly approves a change:

- Framework: SvelteKit
- UI: Svelte 5
- Language: TypeScript with strict type checking
- Styling: Tailwind CSS
- Component library: shadcn-svelte
- Icons: Lucide
- Package manager: Bun
- Movie data: TMDB API v3
- HTTP client: native Fetch API
- Server-side secrets: SvelteKit private environment variables
- Initial persistence: localStorage for watchlists
- Unit testing: Vitest
- End-to-end testing: Playwright
- Deployment: VPS using Caddy or Nginx

Inspect the existing repository before making changes. Preserve valid existing configurations and dependencies.

Do not introduce a separate backend, database, Redis, authentication, or container infrastructure unless explicitly requested.

## 3. Mandatory Design Skills

TasteSkill and UI UX Pro Max are installed in the development environment.

Before creating or significantly changing UI:

1. Locate and read both installed skill instructions.
2. Follow their documented workflows and recommendations.
3. Apply the skills to the actual design and implementation.
4. Inspect existing design tokens and reusable components before adding new ones.
5. Use the skills' supported tools and commands only as documented.
6. Avoid duplicating functionality already provided by existing skills or project components.

Do not merely mention the skills in the final report. Their guidance must influence the implementation.

If a skill cannot be located or loaded, report the limitation and continue using established UI/UX best practices.

## 4. Product Identity and Design Direction

Product name: Scenora

Product tagline: Find your next favorite.

Primary design direction: Cinematic Editorial.

The experience should combine the visual appeal of a film magazine with the usability of a modern discovery platform.

### Initial color tokens

- Background: #0B0D12
- Surface: #151922
- Elevated surface: #202632
- Primary text: #F4F4F5
- Muted text: #9299A8
- Accent: #B7F36B

Treat these as initial values. Refine them using the installed design skills when appropriate.

Store design tokens centrally using CSS variables or the project's established theme configuration.

### Typography

Prefer a distinctive, readable sans-serif pairing.

Possible choices:

- Headings: Space Grotesk.
- Body: Inter or Geist Sans.

Choose a practical font-loading strategy and avoid loading unnecessary font families or weights.

### Visual rules

- Use dark cinematic backgrounds and restrained surface contrast.
- Make movie posters and backdrops the primary visual elements.
- Preserve the 2:3 aspect ratio for movie posters.
- Use wide aspect ratios for cinematic backdrops.
- Establish clear typography and spacing hierarchies.
- Use restrained shadows, borders, and gradients.
- Use subtle, purposeful motion.
- Avoid excessive glassmorphism, glow effects, and decorative animations.
- Avoid excessive rounded cards and repetitive bordered containers.
- Never sacrifice readability or accessibility for visual novelty.
- Ensure desktop hover interactions remain usable on touch devices.

## 5. Development Workflow

Work incrementally and follow the six agreed project phases.

### Phase 1 — Foundation and Design System

- Project setup and configuration.
- Design tokens and global styles.
- Responsive application shell.
- Navbar and footer.
- Homepage using mock movie data.
- Reusable movie cards and collection sections.
- Placeholder routes.

### Phase 2 — TMDB Integration and Homepage

- Server-side TMDB API client.
- Trending, popular, now-playing, and upcoming movies.
- Real movie posters and backdrops.
- Loading, error, and empty states.
- API error handling and caching where appropriate.

### Phase 3 — Search and Explore

- Debounced search.
- Genre and year filters.
- Rating filters and sorting.
- Pagination.
- URL query parameter synchronization.

### Phase 4 — Movie Details and Discovery

- Movie detail pages.
- Cast and crew.
- Trailers.
- Similar movies and recommendations.
- Additional metadata and actor pages if required.

### Phase 5 — Watchlist and Personalization

- Persistent local watchlist.
- Add and remove movie actions.
- Watchlist page.
- Search history or lightweight personalization when justified.

### Phase 6 — Quality and Deployment

- Testing and production build.
- SEO and Open Graph metadata.
- Accessibility and responsive audits.
- Image optimization.
- TMDB attribution.
- Production environment and deployment documentation.

### Phase execution rules

- Implement only the phase explicitly requested.
- Do not start later phases automatically.
- Inspect existing work before making changes.
- Preserve working functionality.
- Follow each phase's acceptance criteria.
- Report blockers rather than silently skipping requirements.
- Ask questions only when a missing decision materially affects architecture or scope.

## 6. Architecture and Code Quality

- Use Svelte 5 runes for new reactive component logic.
- Follow SvelteKit routing and server/client boundaries.
- Use TypeScript types for API responses and application data.
- Avoid `any` unless absolutely necessary and documented.
- Separate API access, data transformations, state, and presentation.
- Keep server-only code in appropriate server-only modules.
- Keep mock data separate from UI components.
- Use reusable components when they eliminate meaningful duplication.
- Avoid giant components and unnecessary abstraction.
- Use stable IDs for list rendering.
- Use semantic links for navigation and buttons for actions.
- Keep loading, error, and empty states explicit.
- Avoid adding libraries when existing platform APIs are sufficient.

Do not implement future-phase features prematurely.

## 7. TMDB Security and API Practices

When Phase 2 or later explicitly requires TMDB integration:

- Keep the Bearer token server-side.
- Store local development credentials in `.env`.
- Use SvelteKit private environment variables.
- Never prefix private credentials with `VITE_`.
- Never hardcode real credentials.
- Never expose tokens in browser bundles, HTML, localStorage, logs, or Git.
- Maintain `.env.example` with placeholder values only.
- Centralize TMDB requests in a server-side API client.
- Use appropriate types and explicit HTTP error handling.
- Handle authentication errors, missing resources, rate limits, and network failures.
- Avoid unnecessary repeated requests.
- Cache suitable read-only responses when appropriate.
- Use TMDB image configuration and suitable image sizes.
- Do not fetch credits and full details for every movie card.
- Respect TMDB's applicable terms, attribution, and licensing requirements.

Do not implement TMDB integration during Phase 1.

## 8. UI/UX Quality Requirements

Every page must be reviewed for:

- Visual hierarchy.
- Consistent spacing and typography.
- Responsive behavior.
- Readable contrast.
- Clear interactive states.
- Keyboard accessibility.
- Visible focus indicators.
- Appropriate touch targets.
- Loading, empty, error, and missing-image states.
- Reduced-motion support.
- Layout stability while images load.

Use representative viewport sizes:

- Mobile: 375px and 390px.
- Tablet: 768px.
- Desktop: 1280px.
- Wide desktop: 1440px or above.

Do not rely exclusively on desktop hover interactions.

Do not claim that visual validation passed unless the relevant browser or screenshot inspection was actually performed.

## 9. Git Workflow

Use Git to understand and review changes.

Before editing:

- Inspect `git status`.
- Review relevant files and project conventions.
- Inspect recent history when useful.
- Preserve unrelated user changes.

After editing:

- Review `git diff`.
- Run `git diff --check`.
- Inspect generated and modified files.
- Validate the implementation using available project scripts.

Do not automatically commit, amend commits, or push changes.

Never run destructive Git operations such as `git reset --hard`, `git clean -fd`, or force pushes without explicit authorization.

## 10. Command Restrictions

- Do not run Docker commands.
- Do not run Podman commands.
- Do not start, stop, or remove containers.
- Do not modify databases or database schemas.
- Do not install system packages without permission.
- Do not modify unrelated infrastructure or services.
- Do not expose environment variables or secrets in logs.
- Do not run unnecessary long-lived processes.

Inspect `package.json` before running scripts. If a validation script is missing, report that limitation instead of inventing a successful result.

## 11. Testing and Verification

Run the checks relevant to the task and available in the repository.

Preferred checks:

- `bun run check`
- `bun run lint`
- `bun run test`
- `bun run build`

Do not assume all scripts exist.

For changed functionality, verify normal behavior and relevant edge cases.

For UI changes, verify responsive layouts and important interactions whenever the environment permits.

Do not claim tests passed unless they were actually executed successfully.

Clearly distinguish existing failures from newly introduced failures when sufficient evidence exists.

## 12. Definition of Done

A task is complete when:

1. The requested scope has been implemented.
2. Existing functionality remains intact.
3. Design conventions and installed skill guidance have been followed.
4. Relevant validation has been executed.
5. No secrets have been exposed.
6. Important responsive and error states have been considered.
7. Git changes have been reviewed.
8. Remaining limitations are documented.

### Required final report

At the end of each phase, report:

- Implementation summary.
- Files created or modified.
- Important technical decisions.
- Validation commands and actual results.
- Known issues and unverified requirements.
- Suggested next phase.

Never claim completion without evidence.

Prioritize correctness, usability, maintainability, accessibility, performance, and visual quality over unnecessary complexity.
