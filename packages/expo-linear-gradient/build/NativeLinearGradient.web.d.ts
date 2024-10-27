import * as React from 'react';
import { NativeLinearGradientPoint, NativeLinearGradientProps } from './NativeLinearGradient.types';
export default function NativeLinearGradient({ colors, locations, startPoint, endPoint, ...props }: NativeLinearGradientProps): React.ReactElement;
/**
 * Extracted to a separate function in order to be able to test logic independently.
 */
export declare function getLinearGradientBackgroundImage(colors: readonly number[] | string[], locations?: readonly number[] | null, startPoint?: NativeLinearGradientPoint | null, endPoint?: NativeLinearGradientPoint | null, width?: number, height?: number): string;
//# sourceMappingURL=NativeLinearGradient.web.d.ts.map