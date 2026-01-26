import "react-native-reanimated";
export type SwiftUIState<T> = {
    setValue: (value: T) => void;
    getValue: () => T;
    stateId: number;
};
export declare function useSwiftUIState<T>(initialValue: T): SwiftUIState<T>;
export declare function registerOnChange<T>(stateId: number, onChange: (value: T) => void): void;
//# sourceMappingURL=index.d.ts.map