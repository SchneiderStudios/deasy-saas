import React from 'react';

/**
 * Тонкие значки для экрана разбора — вместо эмодзи.
 * Один стиль: линия 1.7, скруглённые концы, цвет наследуется от текста (currentColor).
 */

type P = { size?: number; className?: string };

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export const IconCalendar = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconClock = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconShield = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v5c0 4.4-2.9 8.2-7 10-4.1-1.8-7-5.6-7-10V6z" />
  </svg>
);

export const IconPhone = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z" />
  </svg>
);

export const IconDoc = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const IconSteps = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 18h4v-4h4v-4h4V6h4" />
  </svg>
);

export const IconCheck = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const IconChat = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
  </svg>
);

export const IconInfo = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.2" />
  </svg>
);

export const IconBag = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

export const IconFlag = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 21V4M5 5h11l-2 3.5L16 12H5" />
  </svg>
);

export const IconCompass = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </svg>
);

export const IconCamera = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 8h3.5l1.5-2h8l1.5 2H21a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const IconEye = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
