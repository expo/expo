import type { ReactNode } from 'react';

export type { JasmineInterface } from 'jasmine-core/lib/jasmine-core/jasmine';

export type SetPortalChild = (child: ReactNode) => void;

/** The portal handle `TestScreen` passes as the second argument of every `test`. */
export type TestPortal = {
  setPortalChild: SetPortalChild;
  cleanupPortal: () => Promise<void>;
};

export type JasmineResult = {
  id: string;
  description: string;
  fullName: string;
  status: string;
  failedExpectations: { matcherName?: string; message: string }[];
};

export type Suite = {
  result: JasmineResult;
  children: Suite[];
  specs: JasmineResult[];
  moduleName?: string;
  duration?: number;
};
