---
trigger: always_on
---

# design-system.md — SecureGate

## Design Philosophy

SecureGate's UI communicates one thing above all else: **trustworthiness**. The interface is clean, minimal, and deliberate. Every visual decision should reduce cognitive load and build user confidence — especially during sensitive flows like password reset and email verification.

> Calm, clear, and controlled. No decorative noise. Security through clarity.

---

## Principles

1. **Clarity over cleverness** — Labels, errors, and states must be unambiguous.
2. **Feedback at every step** — Loading states, success confirmations, and inline errors are non-negotiable.
3. **Accessible by default** — Every input has a label, every interactive element is keyboard-navigable.
4. **Consistent spacing** — Use the Tailwind spacing scale only. No arbitrary values.
5. **Mobile first** — All layouts must work at 375px before scaling up.

---

## Color Palette

All colours use Tailwind utility classes. Custom values go in `tailwind.config.ts` under `theme.extend.colors`.

### Core Palette

| Role | Class | Hex | Usage |
|---|---|---|---|
| Background | `bg-white` | `#FFFFFF` | Page background |
| Surface | `bg-gray-50` | `#F9FAFB` | Card / form container |
| Border | `border-gray-200` | `#E5E7EB` | Input borders, dividers |
| Text Primary | `text-gray-900` | `#111827` | Headings, body |
| Text Secondary | `text-gray-500` | `#6B7280` | Subtext, hints |
| Text Muted | `text-gray-400` | `#9CA3AF` | Placeholder text |
| Brand / CTA | `bg-gray-900` | `#111827` | Primary button |
| Brand Hover | `bg-gray-700` | `#374151` | Primary button hover |

### Semantic Colours

| Role | Class | Usage |
|---|---|---|
| Error | `text-red-600` / `bg-red-50` / `border-red-300` | Validation errors, failure states |
| Success | `text-green-700` / `bg-green-50` / `border-green-300` | Verification success, confirmed states |
| Warning | `text-yellow-700` / `bg-yellow-50` / `border-yellow-300` | Expiry notices, cautionary messages |
| Info | `text-blue-700` / `bg-blue-50` / `border-blue-300` | Informational banners |

### Password Strength Indicator Colours

| Strength | Label | Class |
|---|---|---|
| Weak | Weak | `bg-red-500` |
| Fair | Fair | `bg-yellow-400` |
| Strong | Strong | `bg-green-500` |

---

## Typography

| Role | Tailwind Classes | Notes |
|---|---|---|
| Page Heading | `text-2xl font-semibold text-gray-900` | Used on auth pages (`Sign In`, `Create Account`) |
| Sub-heading | `text-base font-medium text-gray-700` | Section labels |
| Body | `text-sm text-gray-600` | Descriptive copy, helper text |
| Label | `text-sm font-medium text-gray-700` | All form field labels |
| Error Text | `text-sm text-red-600` | Inline validation messages |
| Link | `text-sm text-gray-900 underline hover:text-gray-600` | Navigation links |
| Muted / Caption | `text-xs text-gray-400` | Password hints, expiry notices |

**Font**: Use the system font stack via Tailwind's default `font-sans`. No external font CDN required for MVP.

---

## Spacing System

Stick to the Tailwind spacing scale. Most commonly used values:

| Token | Value | Typical Use |
|---|---|---|
| `p-4` | 16px | Card internal padding (mobile) |
| `p-6` | 24px | Card internal padding (desktop) |
| `p-8` | 32px | Page section padding |
| `gap-4` | 16px | Form field gap |
| `gap-6` | 24px | Section gap |
| `mt-2` | 8px | Label → input |
| `mt-1` | 4px | Input → error message |
| `mb-6` | 24px | Field group → submit button |

---

## Layout

### Page Layout
All auth pages use a centered single-column layout:

```
┌────────────────────────────────────────────┐
│                  (bg-gray-50)               │
│                                             │
│         ┌────────────────────────┐          │
│         │   Logo / Product Name  │          │
│         │                        │          │
│         │   Page Heading         │          │
│         │   Subtext              │          │
│         │                        │          │
│         │   [Form Card]          │          │
│         │                        │          │
│         │   Footer links         │          │
│         └────────────────────────┘          │
│                                             │
└────────────────────────────────────────────┘
```

```tsx
// Page shell pattern
<main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
  <div className="w-full max-w-md">
    {/* Logo */}
    {/* Heading */}
    {/* Form card */}
  </div>
</main>
```

### Form Card
```tsx
<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mt-8">
  {/* Form content */}
</div>
```

---

## Component Specifications

### Input Field

```tsx
<div className="space-y-1">
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email address
  </label>
  <input
    id="email"
    type="email"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
               placeholder:text-gray-400
               focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
               disabled:bg-gray-50 disabled:text-gray-400"
    placeholder="you@example.com"
  />
  {/* Error state — add border-red-300 and ring-red-500 */}
</div>
```

**Error state** — add these classes when validation fails:
- Input: `border-red-300 focus:ring-red-500`
- Error message below: `<p className="text-sm text-red-600 mt-1">{errorMessage}</p>`

---

### Primary Button

```tsx
<button
  type="submit"
  disabled={isLoading}
  className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-lg
             hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
             disabled:opacity-50 disabled:cursor-not-allowed
             transition-colors duration-150"
>
  {isLoading ? (
    <span className="flex items-center justify-center gap-2">
      <Spinner className="h-4 w-4 animate-spin" />
      Loading...
    </span>
  ) : (
    label
  )}
</button>
```

**Rules:**
- Always `disabled` during submission.
- Always show loading indicator during async operations.
- Full-width (`w-full`) in form context.

---

### Secondary / Ghost Button

```tsx
<button
  className="w-full border border-gray-300 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg
             hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
             transition-colors duration-150"
>
  Resend Verification Email
</button>
```

---

### Alert / Banner

```tsx
// Error banner
<div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
  <ErrorIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
  <p className="text-sm text-red-700">{message}</p>
</div>

// Success banner
<div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
  <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
  <p className="text-sm text-green-700">{message}</p>
</div>
```

---

### Password Strength Indicator

Shown on: `/signup`, `/reset-password/[token]`.

```tsx
<div className="mt-2 space-y-1">
  {/* Bar */}
  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-300 ${strengthBarClass}`}
      style={{ width: strengthPercent }}
    />
  </div>
  {/* Label */}
  <p className={`text-xs font-medium ${strengthLabelClass}`}>{strengthLabel}</p>
</div>
```

| Strength | `strengthBarClass` | `strengthPercent` | `strengthLabel` |
|---|---|---|---|
| Weak | `bg-red-500` | `33%` | `Weak` |
| Fair | `bg-yellow-400` | `66%` | `Fair` |
| Strong | `bg-green-500` | `100%` | `Strong` |

---

## Page-Level States

Every auth page must handle and display these states:

| State | UI Requirement |
|---|---|
| Idle | Default form, no messages |
| Loading | Button disabled + spinner, inputs optionally disabled |
| Success | Success banner or redirect (no ambiguity about what happened) |
| Error | Error banner at top of form + inline errors on affected fields |
| Rate limited | Error banner: "Too many attempts. Please try again later." |

---

## Responsive Breakpoints

| Screen | Max card width | Padding |
|---|---|---|
| Mobile (< 640px) | Full width minus `px-4` | `p-4` on card |
| Tablet+ (≥ 640px) | `max-w-md` (448px) | `p-6` on card |

All forms must be usable and readable at 375px viewport width. No horizontal scrolling.

---

## Accessibility Checklist

- [ ] Every `<input>` has a corresponding `<label htmlFor="...">`.
- [ ] Error messages are associated with inputs via `aria-describedby`.
- [ ] Buttons have meaningful text (not just icons).
- [ ] Focus rings are visible — never `outline-none` without a replacement ring.
- [ ] Colour is never the only way to convey information (errors also have icons/text).
- [ ] Loading state is communicated in text, not just visually.

---

## Email Templates

Stored in `src/emails/`. Built with React Email.

**Shared email style rules:**
- Clean, single-column layout.
- White background, dark text.
- Prominent CTA button (dark background, white text, rounded).
- Include expiry notice below the CTA in muted text.
- SecureGate product name in header.
- Professional but concise — no marketing language.

| Template | Subject Line |
|---|---|
| `VerifyEmail.tsx` | `Verify your SecureGate account` |
| `ResetPassword.tsx` | `Reset your SecureGate password` |