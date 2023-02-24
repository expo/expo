import type { generateFunctionMap as generateFunctionMapType } from 'metro-source-map';
type GenerateFunctionMapParams = Parameters<typeof generateFunctionMapType>;
export declare function generateFunctionMap(...props: GenerateFunctionMapParams): ReturnType<typeof generateFunctionMapType> | null;
export {};
