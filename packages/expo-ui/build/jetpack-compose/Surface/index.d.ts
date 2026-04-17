import React from 'react';
import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
import { ShapeJSXElement } from '../Shape';
/**
 * Border stroke configuration.
 */
export type SurfaceBorder = {
    /**
     * Border width in dp.
     * @default 1
     */
    width?: number;
    /**
     * Border color.
     * @default MaterialTheme.colorScheme.outline
     */
    color?: ColorValue;
};
export type SurfaceProps = {
    /**
     * The content to display inside the surface.
     */
    children?: React.ReactNode;
    /**
     * The background color of the surface.
     * Defaults to `MaterialTheme.colorScheme.surface`.
     */
    color?: ColorValue;
    /**
     * The color of the content inside the surface.
     * Defaults to `contentColorFor(color)`.
     */
    contentColor?: ColorValue;
    /**
     * The tonal elevation of the surface, which affects its background color
     * based on the color scheme. Value in dp.
     *
     * @default 0
     */
    tonalElevation?: number;
    /**
     * The shadow elevation of the surface. Value in dp.
     *
     * @default 0
     */
    shadowElevation?: number;
    /**
     * Shape configuration for clipping the surface.
     */
    shape?: ShapeJSXElement;
    /**
     * Border stroke drawn around the surface.
     */
    border?: SurfaceBorder;
    /**
     * Whether the surface is enabled and responds to user interaction.
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Whether the surface is in a selected state. When provided together with `onClick`,
     * the surface becomes a selectable surface that visually reflects its selection state.
     */
    selected?: boolean;
    /**
     * Whether the surface is in a checked (toggled on) state. When provided together with
     * `onCheckedChange`, the surface becomes a toggleable surface.
     */
    checked?: boolean;
    /**
     * Called when the surface is clicked. Providing this callback makes the surface clickable.
     * When combined with `selected`, the surface becomes a selectable variant.
     */
    onClick?: () => void;
    /**
     * Called when the checked state of a toggleable surface changes.
     * Providing this callback together with `checked` enables the toggleable variant.
     */
    onCheckedChange?: (checked: boolean) => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * A Material Design surface container. Surface is responsible for:
 * - Clipping content to the shape
 * - Applying background color based on tonal elevation
 * - Providing content color to its children
 */
export declare function Surface(props: SurfaceProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map