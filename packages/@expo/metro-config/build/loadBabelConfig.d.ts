import type { TransformOptions } from './babel-core';
/**
 * Returns a memoized function that checks for the existence of a
 * project-level .babelrc file. If it doesn't exist, it reads the
 * default React Native babelrc file and uses that.
 */
export declare const loadBabelConfig: ({ projectRoot }: {
    projectRoot: string;
}) => Pick<TransformOptions, "extends" | "presets">;
