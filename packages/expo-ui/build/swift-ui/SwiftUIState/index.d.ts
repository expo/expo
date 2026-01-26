import "react-native-reanimated";
export type SwiftUIState<T> = {
    setValue: (value: T) => void;
    getValue: () => T;
    stateId: number;
};
type OnChangeCallback<T> = (newValue: T, setValue: (value: T) => void) => void;
export declare function useSwiftUIState<T>(initialValue: T, onChange?: OnChangeCallback<T>): SwiftUIState<T>;
export declare function registerOnChange<T>(stateId: number, onChange: (value: T) => void): () => void;
export {};
//# sourceMappingURL=index.d.ts.map