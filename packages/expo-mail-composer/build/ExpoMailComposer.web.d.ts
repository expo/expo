import { MailComposerOptions, MailComposerResult } from './MailComposer.types';
declare const _default: {
    readonly name: string;
    composeAsync(options: MailComposerOptions): Promise<MailComposerResult>;
    isAvailableAsync(): Promise<boolean>;
};
export default _default;
