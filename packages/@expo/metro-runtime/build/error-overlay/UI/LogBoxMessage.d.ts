import { StyleProp, TextStyle } from "react-native";
import type { Message } from "../Data/parseLogBoxLog";
type Props = {
    message: Message;
    style: StyleProp<TextStyle>;
    plaintext?: boolean;
    maxLength?: number;
};
export declare function LogBoxMessage(props: Props): JSX.Element;
export {};
//# sourceMappingURL=LogBoxMessage.d.ts.map