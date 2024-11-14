import ora from 'ora';
export type StepOptions = ora.Options;
export declare function newStep<Result>(title: string, action: (step: ora.Ora) => Promise<Result> | Result, options?: StepOptions): Promise<Result>;
