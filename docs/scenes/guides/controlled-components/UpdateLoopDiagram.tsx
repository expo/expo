import { mergeClasses } from '@expo/styleguide';
import type { ReactNode } from 'react';

import { CODE } from '~/ui/components/Text';

type Step = {
  lane: 'native' | 'js';
  label: ReactNode;
  placement: string;
};

const LANES = {
  native: 'Native/UI thread',
  js: 'JavaScript thread',
} as const;

const STEPS: Step[] = [
  { lane: 'native', label: 'Keystroke', placement: 'md:col-start-1 md:row-start-1' },
  { lane: 'native', label: 'Field shows the raw text', placement: 'md:col-start-2 md:row-start-1' },
  {
    lane: 'js',
    label: (
      <>
        <CODE>onChangeText</CODE> fires with the string
      </>
    ),
    placement: 'md:col-start-3 md:row-start-3',
  },
  {
    lane: 'js',
    label: 'State update, then re-render',
    placement: 'md:col-start-4 md:row-start-3',
  },
  {
    lane: 'native',
    label: (
      <>
        <CODE>value</CODE> forces the field to match
      </>
    ),
    placement: 'md:col-start-5 md:row-start-1',
  },
];

const CONNECTORS = [
  { x1: 10, y1: 19.4, x2: 30, y2: 19.4 },
  { x1: 30, y1: 19.4, x2: 50, y2: 80.6 },
  { x1: 50, y1: 80.6, x2: 70, y2: 80.6 },
  { x1: 70, y1: 80.6, x2: 90, y2: 19.4 },
];

export function UpdateLoopDiagram() {
  return (
    <div className="my-5 rounded-lg border border-default bg-default p-4">
      <div className="flex gap-3">
        <div className="hidden w-24 shrink-0 md:grid md:grid-rows-[84px_48px_84px]">
          <span className="row-start-1 self-center text-[10px] font-semibold tracking-wide text-tertiary uppercase">
            {LANES.native}
          </span>
          <span className="row-start-3 self-center text-[10px] font-semibold tracking-wide text-tertiary uppercase">
            {LANES.js}
          </span>
        </div>
        <div className="relative grid flex-1 grid-cols-1 gap-3 md:grid-cols-5 md:grid-rows-[84px_48px_84px] md:gap-x-2 md:gap-y-0">
          <div
            className="absolute inset-x-0 top-0 hidden h-21 rounded-md bg-subtle md:block"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 bottom-0 hidden h-21 rounded-md bg-subtle md:block"
            aria-hidden="true"
          />
          <svg
            className="pointer-events-none absolute inset-0 hidden size-full text-icon-secondary md:block"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true">
            {CONNECTORS.map(line => (
              <line
                key={`${line.x1}-${line.y1}-${line.x2}`}
                {...line}
                stroke="currentColor"
                strokeWidth={1.25}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {STEPS.map((step, index) => (
            <div
              key={LANES[step.lane] + index}
              className={mergeClasses('relative z-10 md:self-center', step.placement)}>
              <div className="relative mx-1 rounded-md border border-default bg-default px-2.5 py-2 shadow-xs">
                <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-palette-purple7 bg-palette-purple3 text-[10px] font-semibold text-default">
                  {index + 1}
                </span>
                <p className="text-center text-xs leading-snug text-default">{step.label}</p>
                <span className="mt-1.5 block text-center text-[10px] tracking-wide text-tertiary uppercase md:hidden">
                  {LANES[step.lane]}
                </span>
              </div>
            </div>
          ))}
          <div
            className={mergeClasses(
              'z-10 text-xs text-secondary',
              'max-md:p-2.5 max-md:text-center',
              'md:col-start-2 md:col-end-6 md:row-start-2 md:self-center md:px-2 md:text-center'
            )}>
            Between steps 2 and 5, the field shows text your state doesn't hold yet.
          </div>
        </div>
      </div>
    </div>
  );
}
