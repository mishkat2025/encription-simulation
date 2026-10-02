// Inline SVG icons, so the app needs no icon library.

import type { ReactNode } from 'react';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const PlayIcon = () => (
  <Icon>
    <path d="M5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
  </Icon>
);
export const PauseIcon = () => (
  <Icon>
    <path d="M5.5 3.5v9M10.5 3.5v9" strokeWidth="2.2" />
  </Icon>
);
export const NextIcon = () => (
  <Icon>
    <path d="M6 3.5l4.5 4.5L6 12.5" />
  </Icon>
);
export const PrevIcon = () => (
  <Icon>
    <path d="M10 3.5L5.5 8l4.5 4.5" />
  </Icon>
);
export const RestartIcon = () => (
  <Icon>
    <path d="M4 3.5v9M12 3.5L6.5 8l5.5 4.5" />
  </Icon>
);
export const EndIcon = () => (
  <Icon>
    <path d="M12 3.5v9M4 3.5L9.5 8 4 12.5" />
  </Icon>
);
export const CopyIcon = () => (
  <Icon>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
  </Icon>
);
export const SwapIcon = () => (
  <Icon>
    <path d="M3 5.5h10M10.5 3L13 5.5 10.5 8M13 10.5H3M5.5 8L3 10.5 5.5 13" />
  </Icon>
);
export const SunIcon = () => (
  <Icon>
    <circle cx="8" cy="8" r="2.8" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
  </Icon>
);
export const MoonIcon = () => (
  <Icon>
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" />
  </Icon>
);
export const ArrowRightIcon = () => (
  <Icon>
    <path d="M3 8h10M9.5 4.5L13 8l-3.5 3.5" />
  </Icon>
);
export const CheckIcon = () => (
  <Icon>
    <path d="M3.5 8.5l3 3 6-7" />
  </Icon>
);
