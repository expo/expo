import { Theme } from './types';
export declare type ProcessedTheme = {
    [K in keyof Theme]?: number;
};
export default function processTheme(theme?: Theme): ProcessedTheme;
