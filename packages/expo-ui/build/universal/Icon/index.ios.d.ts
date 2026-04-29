import type { IconProps, IconSelectSpec } from './types';
/**
 * Universal `Icon` component. On iOS, renders an SF Symbol via SwiftUI's
 * `Image(systemName:)`.
 */
export declare function Icon({ name, size, color, style, onPress, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: IconProps): import("react/jsx-runtime").JSX.Element;
export declare namespace Icon {
    var select: (spec: IconSelectSpec) => import("sf-symbols-typescript").SFSymbols7_0;
}
export * from './types';
//# sourceMappingURL=index.ios.d.ts.map