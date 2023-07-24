import { GestureResponderEvent } from "react-native";
type Props = {
    onPress?: ((event: GestureResponderEvent) => void) | null;
    status: "COMPLETE" | "FAILED" | "NONE" | "PENDING";
};
export declare function LogBoxInspectorSourceMapStatus(props: Props): JSX.Element | null;
export {};
//# sourceMappingURL=LogBoxInspectorSourceMapStatus.d.ts.map