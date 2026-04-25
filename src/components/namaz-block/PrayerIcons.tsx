import React from 'react';

const baseProps = (props: any) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: props.fill || "none",
  stroke: props.color || "currentColor",
  strokeWidth: props.strokeWidth || 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: props.size || 24,
  height: props.size || 24,
  ...props
});

export const EclipseIcon = ({ animated, ...props }: any) => (
  <svg {...baseProps(props)}>
    <g className={animated ? "anim-spin" : ""}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a7 7 0 1 0 10 10" />
    </g>
  </svg>
);

export const SunIcon = ({ animated, ...props }: any) => (
  <svg {...baseProps(props)}>
    <g className={animated ? "anim-spin" : ""}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </g>
  </svg>
);

export const SunDimIcon = ({ animated, ...props }: any) => (
  <svg {...baseProps(props)}>
    <g className={animated ? "anim-spin" : ""}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 4h.01" />
      <path d="M20 12h.01" />
      <path d="M12 20h.01" />
      <path d="M4 12h.01" />
      <path d="M17.657 6.343h.01" />
      <path d="M17.657 17.657h.01" />
      <path d="M6.343 17.657h.01" />
      <path d="M6.343 6.343h.01" />
    </g>
  </svg>
);

export const SunsetIcon = ({ animated, ...props }: any) => (
  <svg {...baseProps(props)}>
    <g className={animated ? "anim-float" : ""}>
      {/* Moved the arrow up slightly by translating the group up by -2 units */}
      <g transform="translate(0, -2)">
        <path d="M12 10V2" />
        <path d="m16 6-4 4-4-4" />
      </g>
    </g>
    <path d="M2 18h2" />
    <path d="M20 18h2" />
    <path d="M16 18a4 4 0 0 0-8 0" />
    <path d="m4.93 10.93 1.41 1.41" />
    <path d="m19.07 10.93-1.41 1.41" />
  </svg>
);

export const MoonStarIcon = ({ animated, ...props }: any) => (
  <svg {...baseProps(props)}>
    <g className={animated ? "anim-spin-star" : ""}>
      <path d="M18 5h4" />
      <path d="M20 3v4" />
    </g>
    <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
  </svg>
);
