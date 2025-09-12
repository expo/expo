export * from './dom-hooks';

// TODO: Maybe this could be a bundler global instead.
export const IS_DOM = typeof window !== 'undefined' && window.isDOMComponentContext === true;
