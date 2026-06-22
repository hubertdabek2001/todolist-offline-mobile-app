---
name: Fluent Task
colors:
  surface: '#ffffff'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#707882'
  outline-variant: '#bfc7d2'
  surface-tint: '#00639a'
  primary: '#006196'
  on-primary: '#ffffff'
  primary-container: '#007abc'
  on-primary-container: '#fdfcff'
  inverse-primary: '#95ccff'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#95ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004a75'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  success: '#10b981'
  warning: '#f59e0b'
  input-bg: '#f1f5f9'
  connector: '#cbd5e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  body-md-strike:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
---

## Brand & Style

The design system embodies a **Modern Corporate** aesthetic with a strong emphasis on **Minimalism** and **Tactile** clarity. It is designed for high-performance productivity, focusing on reducing cognitive load through ample whitespace, a refined color palette, and clear visual hierarchy.

The brand personality is professional, reliable, and approachable. It seeks to evoke a sense of calm and control in the user's daily workflow. This is achieved through:
- **Soft Geometry:** Using generous border radii to make the interface feel friendly and modern.
- **Micro-Depth:** Utilizing subtle, diffused shadows and tonal layering rather than heavy borders.
- **Focus-First Layout:** Prioritizing task content with secondary actions tucked into intuitive gestures or lightweight icons.

## Colors

The palette is rooted in a professional "Slate" scale, accented by a vibrant functional blue.

- **Primary (#2f95dc):** Used for primary actions, active navigation states, and focus indicators.
- **Surface & Background:** The main interface uses `#f8fafc` as a base to provide a soft contrast against pure white (`#ffffff`) task cards.
- **Functional Colors:** Success (`#10b981`) and Error (`#ef4444`) are reserved for state-specific feedback like completed tasks or destructive actions.
- **Typography Colors:** Primary text uses `#1e293b` for maximum legibility, while `#64748b` is used for secondary metadata and empty states.

## Typography

The system uses **Inter** for all typographic levels to ensure a systematic, utilitarian feel that remains highly readable at small sizes.

- **Hierarchy:** Established through font weight rather than dramatic size shifts. 
- **Readability:** Strikethrough styles are paired with a color shift to `#94a3b8` to clearly indicate completed states without removing the content from the visual flow.
- **Mobile Scaling:** Headings are kept under 32px to ensure they don't wrap awkwardly on smaller devices. Use `headline-md` for standard screen titles.

## Layout & Spacing

The system follows a strict **8px grid** (with 4px increments for micro-adjustments).

- **Grid Strategy:** A fluid grid is used for task lists, allowing cards to span the full width of the container minus the safe-area margins.
- **Nesting:** Sub-tasks are indented by `32px` (`xxl`) and connected visually by a 1px vertical line to clarify parent-child relationships.
- **Safe Areas:** Horizontal margins are fixed at `16px` on mobile. On larger screens, the content width is capped at `768px` and centered.
- **Floating Elements:** The input bar is fixed to the bottom with a dynamic inset that accounts for system gesture areas plus a `12px` buffer.

## Elevation & Depth

Visual hierarchy is managed through **Tonal Layers** and **Ambient Shadows**:

- **Level 0 (Background):** `#f8fafc` (The canvas).
- **Level 1 (Cards):** Pure `white` surfaces with a very soft shadow (Y: 2, Blur: 4, Opacity: 0.03). This creates a "resting" state for tasks.
- **Level 2 (Interactive/Floating):** Primary Action Buttons and Toasts use a more pronounced elevation (Y: 4, Blur: 12, Opacity: 0.15) to appear closer to the user.
- **Depth Cues:** No borders are used on cards; separation is strictly achieved via the contrast between the background and the white surface.

## Shapes

The shape language is consistently **Rounded** to evoke an approachable feel:

- **Cards & Containers:** Use `12px` (`rounded-lg`) as the standard radius.
- **Inputs & Buttons:** Use a `22px` to `24px` radius to create "Pill" shapes for primary interactive elements.
- **Badges:** Use `8px` for secondary context tags.
- **Selection:** Checkboxes are circular or heavily rounded (`6px`+) to maintain the soft aesthetic.

## Components

- **Buttons:** Primary buttons are pill-shaped, using the Primary Blue background with white icons/text. Shadow elevation is applied on tap.
- **Checkboxes:** When unchecked, they use a `#475569` border. When checked, they fill with Success Green and animate a scale-in checkmark.
- **Task Cards:** White background, `12px` radius. Content is padded by `12px` or `16px`. On-press state should subtly dim the background to `#f1f5f9`.
- **Input Fields:** Main task input uses a pill shape with `#f1f5f9` background. When focused, it gains a 1px Primary Blue border.
- **Subtask Connector:** A 1px solid line in `#cbd5e1` that runs vertically from the parent task's icon to the last subtask.
- **Status Toasts:** Positioned at the top or bottom; `12px` radius; high-contrast background (Success/Warning) with white text.