import type { AndroidCommand, CommandEntry } from './types';
export declare const resolveCommand: () => CommandEntry;
export declare const resolveAndroid: (command: AndroidCommand) => CommandEntry;
export declare const resolveIos: () => CommandEntry;
