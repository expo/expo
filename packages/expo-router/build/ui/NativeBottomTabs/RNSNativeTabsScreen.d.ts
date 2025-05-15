import { ViewProps } from 'react-native';
interface HelpfulProps {
    onAppear?: () => void;
    onDisappear?: () => void;
}
export interface RNSNativeTabsScreenProps extends HelpfulProps {
    children: ViewProps['children'];
    isFocused?: boolean;
    badgeValue?: string;
}
export declare function RNSNativeTabsScreen(props: RNSNativeTabsScreenProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=RNSNativeTabsScreen.d.ts.map