import arg from 'arg';
import type { ParseArgsParams } from './types';
export declare const parseArgs: ({ spec, argv, stopAtPositional }: ParseArgsParams) => arg.Result<arg.Spec>;
