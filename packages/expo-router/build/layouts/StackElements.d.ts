import type { StackHeaderBackButtonProps, StackHeaderLeftProps, StackHeaderProps, StackHeaderRightProps, StackHeaderTitleProps, StackHeaderSearchBarProps, StackHeaderConfigurationContextValue, StackScreensConfigurationContextValue, StackScreenConfigurationContextValue, StackScreenProps } from './StackElements.types';
import type { ProtectedProps } from '../views/Protected';
export declare const StackHeaderConfigurationContext: import("react").Context<StackHeaderConfigurationContextValue | undefined>;
declare function StackHeaderComponent({ asChild, children, hidden, blurEffect, style, largeStyle, }: StackHeaderProps): import("react").JSX.Element | null;
declare function StackHeaderLeft({ asChild, children }: StackHeaderLeftProps): null;
declare function StackHeaderRight({ asChild, children }: StackHeaderRightProps): null;
declare function StackHeaderBackButton({ children, style, withMenu, displayMode, src, hidden, }: StackHeaderBackButtonProps): null;
declare function StackHeaderTitle({ children, style, large, largeStyle }: StackHeaderTitleProps): null;
declare function StackHeaderSearchBar(props: StackHeaderSearchBarProps): null;
export declare const ScreensOptionsContext: import("react").Context<StackScreensConfigurationContextValue | undefined>;
export declare const ScreenOptionsContext: import("react").Context<StackScreenConfigurationContextValue | undefined>;
export declare function StackScreen({ name, options, children, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare function StackProtected({ guard, children }: ProtectedProps): import("react").JSX.Element;
export declare const StackHeader: typeof StackHeaderComponent & {
    Left: typeof StackHeaderLeft;
    Right: typeof StackHeaderRight;
    BackButton: typeof StackHeaderBackButton;
    Title: typeof StackHeaderTitle;
    SearchBar: typeof StackHeaderSearchBar;
};
export {};
//# sourceMappingURL=StackElements.d.ts.map