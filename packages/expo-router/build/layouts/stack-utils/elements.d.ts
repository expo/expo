import type { StackHeaderBackButtonProps, StackHeaderLeftProps, StackHeaderProps, StackHeaderRightProps, StackHeaderTitleProps, StackHeaderSearchBarProps, StackScreenProps } from './types';
export declare function StackHeaderComponent(props: StackHeaderProps): null;
export declare function StackHeaderLeft(props: StackHeaderLeftProps): null;
export declare function StackHeaderRight(props: StackHeaderRightProps): null;
export declare function StackHeaderBackButton(props: StackHeaderBackButtonProps): null;
export declare function StackHeaderTitle(props: StackHeaderTitleProps): null;
export declare function StackHeaderSearchBar(props: StackHeaderSearchBarProps): null;
export declare function StackScreen({ children, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare const StackHeader: typeof StackHeaderComponent & {
    Left: typeof StackHeaderLeft;
    Right: typeof StackHeaderRight;
    BackButton: typeof StackHeaderBackButton;
    Title: typeof StackHeaderTitle;
    SearchBar: typeof StackHeaderSearchBar;
};
//# sourceMappingURL=elements.d.ts.map