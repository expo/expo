import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { StackHeaderBackButtonProps, StackHeaderLeftProps, StackHeaderProps, StackHeaderRightProps, StackHeaderTitleProps, StackHeaderSearchBarProps, StackScreenProps } from './StackElements.types';
declare function StackHeaderComponent(props: StackHeaderProps): null;
declare function StackHeaderLeft(props: StackHeaderLeftProps): null;
declare function StackHeaderRight(props: StackHeaderRightProps): null;
declare function StackHeaderBackButton(props: StackHeaderBackButtonProps): null;
declare function StackHeaderTitle(props: StackHeaderTitleProps): null;
declare function StackHeaderSearchBar(props: StackHeaderSearchBarProps): null;
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
export declare function StackScreen({ children, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare const StackHeader: typeof StackHeaderComponent & {
    Left: typeof StackHeaderLeft;
    Right: typeof StackHeaderRight;
    BackButton: typeof StackHeaderBackButton;
    Title: typeof StackHeaderTitle;
    SearchBar: typeof StackHeaderSearchBar;
};
export {};
//# sourceMappingURL=StackElements.d.ts.map