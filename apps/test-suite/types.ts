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
