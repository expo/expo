import 'react-native/Libraries/Core/InitializeCore';
import 'whatwg-fetch';
import 'expo';
declare const polyfillSymbol: unique symbol;
export declare function wrapFetchWithWindowLocation(fetch: Function & {
    [polyfillSymbol]?: boolean;
}): (Function & {
    [polyfillSymbol]?: boolean | undefined;
}) | ((...props: any[]) => any);
export {};
//# sourceMappingURL=install.native.d.ts.map