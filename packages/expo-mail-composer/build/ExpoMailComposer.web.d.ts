import { ComposeOptions, ComposeResult } from './MailComposer.types';
declare const _default: {
    readonly name: string;
    composeAsync(options: ComposeOptions): Promise<ComposeResult>;
    isAvailableAsync(): Promise<boolean>;
};
export default _default;
