import { GestureResponderEvent } from "react-native";
import { StackFrame } from "stacktrace-parser";
type Props = {
    frame: StackFrame & {
        collapse?: boolean;
    };
    onPress?: (event: GestureResponderEvent) => void;
};
export declare function LogBoxInspectorStackFrame(props: Props): JSX.Element;
export {};
//# sourceMappingURL=LogBoxInspectorStackFrame.d.ts.map