// Native file

export * from './dom-hooks';
export type { DOMProps, DOMImperativeFactory } from './dom.types';

// TODO: Maybe this could be a bundler global instead.
/** @returns `true` when the current JS running in a DOM Component environment. */
export const IS_DOM = false;
