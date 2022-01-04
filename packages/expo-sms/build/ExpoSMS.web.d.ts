import { SMSResponse } from './SMS.types';
declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    sendSMSAsync(addresses: string[], message: string): Promise<SMSResponse>;
};
export default _default;
//# sourceMappingURL=ExpoSMS.web.d.ts.map