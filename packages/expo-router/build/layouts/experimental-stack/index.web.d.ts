import type { ComponentProps } from 'react';
import LegacyStack from '../Stack';
declare const ExperimentalStack: ((props: ComponentProps<typeof LegacyStack>) => import("react/jsx-runtime").JSX.Element) & {
    Screen: (({ children, options, ...rest }: import("../stack-utils").StackScreenProps) => import("react/jsx-runtime").JSX.Element) & {
        Title: typeof import("../stack-utils").StackTitle;
        BackButton: typeof import("../stack-utils").StackScreenBackButton;
    };
    Protected: import("react").FunctionComponent<import("../../views/Protected").ProtectedProps>;
};
export { ExperimentalStack };
export default ExperimentalStack;
export type { ExperimentalStackNavigationOptions, ExperimentalStackNavigationEventMap, ExperimentalStackNavigationProp, ExperimentalStackScreenProps, ExperimentalStackNavigationHelpers, } from './types';
//# sourceMappingURL=index.web.d.ts.map