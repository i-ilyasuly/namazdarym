# Agent Instructions

- **CRITICAL RULE**: No matter what task the user gives, you MUST understand it, plan it out, ask clarifying questions if any, and provide suggestions/warnings. You MUST WAIT for the user's answers and explicit permission/approval before starting the actual implementation/code modification.

- Unless explicitly specified otherwise, apply ALL change requests and code modifications ONLY to the test screen (e.g., `src/screens/TestScreen.tsx`).
- DO NOT apply changes to the main/home screen (e.g., `src/screens/HomeScreen.tsx`) unless the user explicitly requests to "copy changes to the home screen" or directly asks to modify the main screen.

Animations:
- The app features a 10-second test loop.
- The prayer block flies and scales smoothly using Animated techniques.

Brandbook Colors (Always use these exact colors):
- Surface Gray (Global background/default): `#f1f1f6`
- Dot Colors (Prayer status):
  - Green (Таң/Құптан): `#10b981`
  - Blue (Бесін): `#3b82f6`
  - Red (Екінті): `#ef4444`
  - Black (Шам): `#1c1c1e`
- Soft Background Colors (Transparent versions of dots for cells):
  - Soft Green: `rgba(16, 185, 129, 0.1)`
  - Soft Blue: `rgba(59, 130, 246, 0.1)`
  - Soft Red: `rgba(239, 68, 68, 0.1)`
  - Soft Black/Gray: `rgba(28, 28, 30, 0.06)`

- The prayer block cells use the soft background colors that match their respective dot colors.
