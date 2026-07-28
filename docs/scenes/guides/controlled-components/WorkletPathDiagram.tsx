import { Fragment, type ReactNode } from 'react';

import { CODE } from '~/ui/components/Text';

type Step = {
  alt: string;
  label?: ReactNode;
};

const STEPS: Step[] = [
  { alt: 'Keystroke' },
  {
    alt: 'onChangeText worklet formats the string',
    label: (
      <>
        <CODE>onChangeText</CODE> worklet formats the string
      </>
    ),
  },
  {
    alt: 'Worklet writes value and selection together',
    label: (
      <>
        Worklet writes <CODE>value</CODE> and <CODE>selection</CODE> together
      </>
    ),
  },
  { alt: 'Field shows the formatted text in the same frame' },
];

const LANE = 'Native/UI thread';
const JS_THREAD_NOTE = 'JavaScript thread: not involved in this update';

const DIAGRAM_ALT = [
  `${LANE}:`,
  STEPS.map((step, index) => `${index + 1}. ${step.alt}`).join('\n→ '),
  JS_THREAD_NOTE,
].join('\n');

export function WorkletPathDiagram() {
  return (
    <div
      className="my-5 rounded-lg border border-default bg-default p-4"
      data-md="diagram"
      data-md-alt={DIAGRAM_ALT}>
      <div className="flex items-center gap-3">
        <div className="hidden w-24 shrink-0 md:block">
          <span className="text-[10px] font-semibold tracking-wide text-tertiary uppercase">
            {LANE}
          </span>
        </div>
        <div className="flex-1 rounded-md bg-subtle p-3">
          <span className="mb-2 block text-center text-[10px] font-semibold tracking-wide text-tertiary uppercase md:hidden">
            {LANE}
          </span>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-2">
            {STEPS.map((step, index) => (
              <Fragment key={step.alt}>
                {index > 0 && <Arrow />}
                <div className="relative flex-1 rounded-md border border-default bg-default px-2.5 py-2 shadow-xs">
                  <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-info bg-info text-[10px] font-semibold text-default">
                    {index + 1}
                  </span>
                  <p className="text-center text-xs leading-snug text-default">
                    {step.label ?? step.alt}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="hidden w-24 shrink-0 md:block" />
        <div className="flex-1 pt-2.5 text-center text-xs text-tertiary">{JS_THREAD_NOTE}</div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      className="hidden h-2 w-5 shrink-0 text-icon-secondary md:block"
      viewBox="0 0 20 8"
      aria-hidden="true">
      <path d="M0 4h17M17 4l-4-3M17 4l-4 3" stroke="currentColor" strokeWidth={1.25} fill="none" />
    </svg>
  );
}
