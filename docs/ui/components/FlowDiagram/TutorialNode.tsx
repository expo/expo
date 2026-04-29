import { mergeClasses } from '@expo/styleguide';
import { Handle, Position } from '@xyflow/react';

type TutorialNodeData = {
  label: string;
  secondaryLabel?: string;
  badge?: string;
  accent: 'blue' | 'green' | 'amber' | 'red' | 'default';
};

type Props = {
  data: TutorialNodeData;
  sourcePosition?: Position;
  targetPosition?: Position;
};

const accentStyles: Record<string, { dot: string; badge: string }> = {
  default: {
    dot: 'bg-palette-gray9',
    badge: 'bg-palette-gray4 text-secondary dark:bg-palette-gray5',
  },
  blue: {
    dot: 'bg-palette-blue9',
    badge: 'bg-palette-blue4 text-palette-blue11 dark:bg-palette-blue5',
  },
  green: {
    dot: 'bg-palette-green9',
    badge: 'bg-palette-green4 text-palette-green11 dark:bg-palette-green5',
  },
  amber: {
    dot: 'bg-palette-orange9',
    badge: 'bg-palette-orange4 text-palette-orange11 dark:bg-palette-orange5',
  },
  red: {
    dot: 'bg-palette-red9',
    badge: 'bg-palette-red4 text-palette-red11 dark:bg-palette-red5',
  },
};

export function TutorialNode({ data, sourcePosition, targetPosition }: Props) {
  const accent = accentStyles[data.accent] ?? accentStyles.default;

  return (
    <div className="border-default bg-default w-50 cursor-default rounded-md border px-3 py-2 shadow-xs">
      {targetPosition && <Handle type="target" position={targetPosition} className="opacity-40" />}
      <div className="flex items-center gap-2">
        <div className={mergeClasses('size-2.5 shrink-0 rounded-full', accent.dot)} />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium">{data.label}</span>
          {data.secondaryLabel && (
            <span className="text-secondary text-xs">{data.secondaryLabel}</span>
          )}
        </div>
      </div>
      {data.badge && (
        <div
          className={mergeClasses(
            'mt-1.5 rounded-md px-1.5 py-0.5 text-center text-xs font-medium',
            accent.badge
          )}>
          {data.badge}
        </div>
      )}
      {sourcePosition && <Handle type="source" position={sourcePosition} className="opacity-40" />}
    </div>
  );
}
