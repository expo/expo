import { type ColorValue, type TextStyle } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
interface TitleProps {
    children: string;
    style?: {
        fontFamily?: TextStyle['fontFamily'];
        fontSize?: TextStyle['fontSize'];
        fontWeight?: TextStyle['fontWeight'];
        fontStyle?: TextStyle['fontStyle'];
        fontColor?: TextStyle['color'];
    };
}
export declare function Title(props: TitleProps): null;
type IconProps = {
    color?: ColorValue;
} & ({
    sfSymbolName: SFSymbol;
} | {
    children: React.ReactNode;
});
export declare function Icon(props: IconProps): null;
interface BadgeProps {
    value: string;
}
export declare function Badge(props: BadgeProps): null;
export {};
//# sourceMappingURL=NavigatorElements.d.ts.map