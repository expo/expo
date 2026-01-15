export class SendMessageError extends Error {
    app;
    constructor(message, app) {
        super(message);
        this.app = app;
    }
}
//# sourceMappingURL=CliExtensionUtils.js.map