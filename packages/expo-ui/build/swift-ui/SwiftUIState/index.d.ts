import "react-native-reanimated";
export declare function useSwiftUIState<T>(initialValue: T, onChange?: (value: T) => T | void): {
    setValue: (value: T) => void;
    getValue: () => T;
    stateId: number;
};
//# sourceMappingURL=index.d.ts.map