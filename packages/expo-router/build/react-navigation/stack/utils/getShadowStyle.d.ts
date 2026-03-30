import { type ColorValue } from 'react-native';
type ShadowConfig = {
    offset: {
        width: number;
        height: number;
    };
    radius: number;
    opacity: number;
    color?: ColorValue;
};
export declare function getShadowStyle({ offset, radius, opacity, color }: ShadowConfig): {
    boxShadow: string;
    shadowOffset?: undefined;
    shadowRadius?: undefined;
    shadowColor?: undefined;
    shadowOpacity?: undefined;
} | {
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowRadius: number;
    shadowColor: ColorValue;
    shadowOpacity: number;
    boxShadow?: undefined;
};
export {};
//# sourceMappingURL=getShadowStyle.d.ts.map