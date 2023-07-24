import type { LogLevel } from "../Data/LogBoxLog";
import type { Message } from "../Data/parseLogBoxLog";
type Props = {
    collapsed: boolean;
    message: Message;
    level: LogLevel;
    title: string;
    onPress: () => void;
};
export declare function LogBoxInspectorMessageHeader(props: Props): JSX.Element;
export {};
//# sourceMappingURL=LogBoxInspectorMessageHeader.d.ts.map