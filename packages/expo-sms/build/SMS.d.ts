declare type SMSResponse = {
    result: 'sent' | 'cancelled';
};
export declare function sendSMSAsync(addresses: string | string[], message: string): Promise<SMSResponse>;
export declare function isAvailableAsync(): Promise<boolean>;
export {};
