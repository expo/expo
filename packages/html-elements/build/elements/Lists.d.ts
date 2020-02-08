import React from 'react';
import { ViewProps } from '../primitives/View';
import { TextProps } from '../primitives/Text';
export declare const UL: React.ComponentType<ViewProps>;
export declare const OL: React.ComponentType<ViewProps>;
declare type LIProps = (TextProps | ViewProps) & {
    bullet?: string;
};
export declare const LI: React.ComponentType<LIProps>;
export {};
