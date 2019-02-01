export default class IOSMessaging {
    _messaging: any;
    constructor(messaging: any);
    getAPNSToken(): Promise<string | null>;
}
