import "react-native-reanimated";
import { NativeSyntheticEvent } from "react-native";
import { useSwiftUIState } from "../SwiftUIState";
type StateInitializeEvent = NativeSyntheticEvent<{
    stateId: number;
}>;
type NativeSyncTextFieldProps = {
    initialValue: string;
    onStateInitialize: (event: StateInitializeEvent) => void;
};
type SyncTextFieldProps = {
    state: ReturnType<typeof useSwiftUIState<NativeSyncTextFieldProps['initialValue']>>;
};
export declare function SyncTextField(props: SyncTextFieldProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map