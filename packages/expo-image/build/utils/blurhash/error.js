export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.message = message;
    }
}
//# sourceMappingURL=error.js.map