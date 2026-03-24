import * as React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { type Route } from '../../../native';
import type { Layout, Scene, StackHeaderMode } from '../../types';
export type Props = {
    mode: StackHeaderMode;
    layout: Layout;
    scenes: (Scene | undefined)[];
    getPreviousScene: (props: {
        route: Route<string>;
    }) => Scene | undefined;
    getFocusedRoute: () => Route<string>;
    onContentHeightChange?: (props: {
        route: Route<string>;
        height: number;
    }) => void;
    style?: StyleProp<ViewStyle>;
};
export declare function HeaderContainer({ mode, scenes, layout, getPreviousScene, getFocusedRoute, onContentHeightChange, style, }: Props): React.JSX.Element;
//# sourceMappingURL=HeaderContainer.d.ts.map