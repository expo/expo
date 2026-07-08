import { Fragment, type ReactNode } from 'react';

import { CODE } from '~/ui/components/Text';

const STEPS: ReactNode[] = [
  'Keystroke',
  <Fragment key="format">
    <CODE>onChangeText</CODE> worklet formats the string
  </Fragment>,
  <Fragment key="write">
    Worklet writes <CODE>value</CODE> and <CODE>selection</CODE> together
  </Fragment>,
  'Field shows the formatted text in the same frame',
];

export function WorkletPathDiagram() {
  return (
    <div className="my-5 rounded-lg border border-default bg-default p-4">
      <div className="flex items-center gap-3">
        <div className="hidden w-24 shrink-0 md:block">
          <span className="text-[10px] font-semibold tracking-wide text-tertiary uppercase">
            Native/UI thread
          </span>
        </div>
        <div className="flex-1 rounded-md bg-subtle p-3">
          <span className="mb-2 block text-center text-[10px] font-semibold tracking-wide text-tertiary uppercase md:hidden">
            Native/UI thread
          </span>
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-2">
            {STEPS.map((label, index) => (
              <Fragment key={index}>
                {index > 0 && <Arrow />}
                <div className="relative flex-1 rounded-md border border-default bg-default px-2.5 py-2 shadow-xs">
                  <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-palette-purple7 bg-palette-purple3 text-[10px] font-semibold text-default">
                    {index + 1}
                  </span>
                  <p className="text-center text-xs leading-snug text-default">{label}</p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="hidden w-24 shrink-0 md:block" />
        <div className="flex-1 pt-2.5 text-center text-xs text-tertiary">
          JavaScript thread: not involved in this update
        </div>
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
