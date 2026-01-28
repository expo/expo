import 'react-native-reanimated';
type UseUIStateRegistryOptions = {
    onChangeSync?: (value: string) => string | void;
};
type UseUIStateRegistryResult = {
    viewId: string;
    setState: (value: string) => void;
    getState: () => string;
};
export declare function useUIStateRegistry(options: UseUIStateRegistryOptions): UseUIStateRegistryResult;
export {};
//# sourceMappingURL=UIStateRegistry.d.ts.map