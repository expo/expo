import { LinkingOptions } from '@react-navigation/native';
import { getPathFromState } from '../fork/getPathFromState';
import { getStateFromPath } from '../fork/getStateFromPath';
import { StoreRedirects } from '../global-state/router-store';
import { NativeIntent } from '../types';
export declare function getInitialURL(): ReturnType<NonNullable<LinkingOptions<Record<string, unknown>>['getInitialURL']>>;
export declare function getRootURL(): string;
export declare function subscribe(nativeLinking: NativeIntent | undefined, redirects: StoreRedirects[] | undefined): (listener: (url: string) => void) => () => void;
export { getStateFromPath, getPathFromState };
//# sourceMappingURL=linking.d.ts.map