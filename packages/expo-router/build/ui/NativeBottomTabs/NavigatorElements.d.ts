import type { SFSymbol } from 'sf-symbols-typescript';
import type { ImageSourcePropType } from 'react-native';
interface TitleProps {
    children: string;
}
export declare function Title(props: TitleProps): null;
interface IOSIconProps {
    useAsSelected?: boolean;
    name: SFSymbol;
}
export declare function IOSIcon(props: IOSIconProps): null;
interface AndroidIconProps {
    name: string;
}
export declare function AndroidIcon(props: AndroidIconProps): null;
interface IconProps {
    useAsSelected?: boolean;
    src: ImageSourcePropType;
}
export declare function Icon(props: IconProps): null;
interface BadgeProps {
    children?: string;
}
export declare function Badge(props: BadgeProps): null;
export {};
//# sourceMappingURL=NavigatorElements.d.ts.map