import { mergeClasses } from '@expo/styleguide';
import { type ReactNode } from 'react';

const DIAL_SIZE = 586;
const DIAL_CENTER = DIAL_SIZE / 2;
const DIAL_RING_RADIUS = DIAL_CENTER - 0.5;
const DIAL_DASH = (Math.PI * DIAL_RING_RADIUS) / 104;
const DIAL_DASH_OFFSET = -13.252;
const DIAL_TICK_OUTER = 276.83;
const DIAL_TICK_INNER = 243.69;
const DIAL_TICK_ANGLES = Array.from({ length: 11 }, (_, index) => ((index + 1) * Math.PI) / 6);

const BORDER_DEFAULT_STROKE = 'stroke-(--expo-theme-border-default)';

function Outline({
  width,
  height,
  className,
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      stroke="currentColor"
      className={mergeClasses('shrink-0 text-(--expo-theme-border-default)', className)}>
      {children}
    </svg>
  );
}

function dialTick(angle: number) {
  return {
    x1: DIAL_CENTER + Math.sin(angle) * DIAL_TICK_INNER,
    y1: DIAL_CENTER - Math.cos(angle) * DIAL_TICK_INNER,
    x2: DIAL_CENTER + Math.sin(angle) * DIAL_TICK_OUTER,
    y2: DIAL_CENTER - Math.cos(angle) * DIAL_TICK_OUTER,
  };
}

export function GetStartedIllustration() {
  return (
    <div
      aria-hidden="true"
      className="relative size-146.5 shrink-0 text-palette-black dark:text-palette-white">
      <Outline width={DIAL_SIZE} height={DIAL_SIZE} className="absolute inset-0">
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_RING_RADIUS}
          strokeDasharray={`${DIAL_DASH} ${DIAL_DASH}`}
          strokeDashoffset={DIAL_DASH_OFFSET}
        />
        {DIAL_TICK_ANGLES.map(angle => (
          <line key={angle} {...dialTick(angle)} />
        ))}
      </Outline>
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(transparent_306.346deg,currentColor_360deg)] mask-[radial-gradient(closest-side,transparent_calc(100%-1px),#000_calc(100%-1px))]" />
      <svg
        width={DIAL_SIZE}
        height={DIAL_SIZE}
        viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="absolute inset-0">
        <line {...dialTick(0)} />
      </svg>
    </div>
  );
}

export function MobileDevIllustration() {
  return (
    <div aria-hidden="true" className="relative h-50 w-65 shrink-0 overflow-hidden">
      <Outline width={199.2} height={200.12} className="absolute top-0 left-[30.666px]">
        <defs>
          <clipPath id="home-mobile-dev-clip">
            <rect width={199.2} height={200.12} rx={58.2711} />
          </clipPath>
        </defs>
        <g clipPath="url(#home-mobile-dev-clip)">
          <rect x={9.23984} y={9.70098} width={180.663} height={180.663} rx={90.3316} />
          <rect x={47.8836} y={48.3447} width={103.888} height={103.888} rx={51.9439} />
          <path d="M8.76912 9.23005L190.642 191.103M190.642 9.43966L8.97872 191.103M62.4685 -3.68047V204.223M137.152 -3.68047V204.223M-4.14141 62.9294H203.762M-4.14141 137.613H203.762M99.8104 -3.68047V204.223M-4.14141 100.271H203.762" />
        </g>
        <rect x={0.5} y={0.5} width={198.2} height={199.12} rx={57.7711} />
      </Outline>
    </div>
  );
}

export function EnterpriseIllustration() {
  return (
    <Outline width={260} height={200} className="text-(--expo-theme-border-secondary)">
      <circle cx={130} cy={100} r={99.5} />
      <ellipse cx={130} cy={99.5} rx={99.5} ry={85} />
      <ellipse cx={130} cy={99.5} rx={99.5} ry={45} />
      <ellipse cx={129.999} cy={99.5} rx={85} ry={99.5} />
      <ellipse cx={129.999} cy={99.5} rx={45} ry={99.5} />
      <line x1={130.5} y1={0} x2={130.5} y2={200} className={BORDER_DEFAULT_STROKE} />
      <line x1={229.995} y1={100.505} x2={29.995} y2={100.505} className={BORDER_DEFAULT_STROKE} />
    </Outline>
  );
}

export function StudentsIllustration() {
  return (
    <Outline width={260} height={200}>
      <ellipse cx={87.166} cy={100} rx={43} ry={99.5} />
      <ellipse cx={65.166} cy={100} rx={65} ry={99.5} />
      <ellipse cx={107.666} cy={100} rx={22.5} ry={99.5} />
      <ellipse cx={152.666} cy={100} rx={22.5} ry={99.5} />
      <ellipse cx={172.166} cy={100} rx={43} ry={99.5} />
      <ellipse cx={194.166} cy={100} rx={65} ry={99.5} />
      <line x1={130.166} y1={0} x2={130.166} y2={200} />
    </Outline>
  );
}

export function AgenticWorkflowsIllustration() {
  return (
    <Outline width={260} height={200}>
      <circle cx={130} cy={100} r={99.4495} strokeWidth={1.10094} />
      <ellipse cx={130} cy={100} rx={99.5} ry={54.5} />
      <ellipse cx={130} cy={100} rx={54.5} ry={99.5} />
      <ellipse cx={130} cy={100} rx={99.5} ry={54.5} transform="rotate(-45 130 100)" />
      <ellipse cx={130} cy={100} rx={99.5} ry={54.5} transform="rotate(45 130 100)" />
      <circle cx={130.334} cy={100} r={29.5} />
    </Outline>
  );
}
