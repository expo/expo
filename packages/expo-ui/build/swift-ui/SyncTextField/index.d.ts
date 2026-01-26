import "react-native-reanimated";
export type SyncTextFieldRef = {
    setState: (value: string) => void;
    getState: () => string;
};
type SyncTextFieldProps = {
    defaultValue?: string;
    onChangeSync?: (value: string) => string | void;
};
export declare const SyncTextField: import("react").ForwardRefExoticComponent<SyncTextFieldProps & import("react").RefAttributes<SyncTextFieldRef>>;
export {};
//# sourceMappingURL=index.d.ts.map