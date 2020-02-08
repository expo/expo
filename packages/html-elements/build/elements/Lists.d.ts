import React from 'react';
import { ViewProps } from '../primitives/View';
import { TextProps } from '../primitives/Text';
export declare const UL: React.ComponentType<ViewProps>;
export declare const Ol: React.ComponentType<ViewProps>;
declare type LiProps = (TextProps | ViewProps) & {
    bullet?: string;
};
export declare const Li: React.ComponentType<LiProps>;
export {};
