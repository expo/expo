import arg, { type Result, type Spec } from 'arg';
import type { ParseArgsParams } from './types';
export declare const parseArgs: ({ spec, argv, stopAtPositional }: ParseArgsParams) => arg.Result<arg.Spec>;
export declare const getCommand: (args: Result<Spec>) => string;
