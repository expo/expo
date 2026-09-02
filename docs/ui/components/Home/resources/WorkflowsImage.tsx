import { mergeClasses } from '@expo/styleguide';

export const WorkflowsImage = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={mergeClasses(
      'absolute right-0 bottom-0 z-1 max-w-[55%] asset-shadow',
      'max-lg:-bottom-4',
      'max-sm:-bottom-8',
      className
    )}
    width="330"
    height="150"
    viewBox="0 0 330 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(9 165 75)">
      <rect
        x="70"
        y="14"
        width="252"
        height="184"
        rx="8"
        className="fill-palette-gray12 dark:fill-palette-gray1"
      />
      <rect x="70" y="14" width="252" height="28" rx="8" fill="#26292E" />
      <rect x="70" y="30" width="252" height="12" fill="#26292E" />
      <circle cx="88" cy="28" r="4" fill="#4A4F55" />
      <circle cx="102" cy="28" r="4" fill="#4A4F55" />
      <rect x="118" y="23" width="92" height="10" rx="5" fill="#3A3F45" />
      <path d="M100 68v22M100 112v22" stroke="#33373C" strokeWidth="2.5" />
      <circle cx="100" cy="60" r="10" fill="#30A46C" />
      <path
        d="M95 60l3.4 3.4 5.8-6.8"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="120" y="51" width="124" height="9" rx="4.5" fill="#4A4F55" />
      <rect x="120" y="65" width="72" height="7" rx="3.5" fill="#33373C" />
      <circle cx="100" cy="102" r="10" fill="#30A46C" />
      <path
        d="M95 102l3.4 3.4 5.8-6.8"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="120" y="93" width="142" height="9" rx="4.5" fill="#4A4F55" />
      <rect x="120" y="107" width="60" height="7" rx="3.5" fill="#33373C" />
      <circle
        cx="100"
        cy="144"
        r="10"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeDasharray="38 25"
        strokeLinecap="round"
      />
      <rect x="120" y="135" width="106" height="9" rx="4.5" fill="#4A4F55" />
      <rect x="120" y="149" width="84" height="7" rx="3.5" fill="#33373C" />
    </g>
  </svg>
);
