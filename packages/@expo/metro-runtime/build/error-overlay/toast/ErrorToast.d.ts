import { LogBoxLog } from '../Data/LogBoxLog';
type Props = {
    log: LogBoxLog;
    totalLogCount: number;
    level: 'warn' | 'error';
    onPressOpen: () => void;
    onPressDismiss: () => void;
};
export declare function ErrorToast(props: Props): JSX.Element;
export {};
//# sourceMappingURL=ErrorToast.d.ts.map