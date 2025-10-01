"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusError = void 0;
exports.errorToResponse = errorToResponse;
class StatusError extends Error {
    status;
    body;
    constructor(status = 500, body, errorOptions) {
        const cause = (errorOptions != null && errorOptions.cause) ??
            (body != null && typeof body === 'object' && body.cause != null ? body.cause : undefined);
        let message = typeof body === 'object' ? (body instanceof Error ? body.message : body.error) : body;
        if (message == null) {
            switch (status) {
                case 400:
                    message = 'Bad Request';
                    break;
                case 401:
                    message = 'Unauthorized';
                    break;
                case 403:
                    message = 'Forbidden';
                    break;
                case 404:
                    message = 'Not Found';
                    break;
                case 500:
                    message = 'Internal Server Error';
                    break;
                default:
                    message = 'Unknown Error';
            }
        }
        super(message, cause ? { cause } : undefined);
        this.name = 'StatusError';
        this.status = status;
        if (body instanceof Error) {
            this.body = JSON.stringify({ error: body.message }, null, 2);
        }
        else {
            this.body =
                typeof body === 'object'
                    ? JSON.stringify(body, null, 2)
                    : (body ?? JSON.stringify({ error: message }, null, 2));
        }
    }
}
exports.StatusError = StatusError;
function errorToResponse(error) {
    if (error instanceof StatusError) {
        return new Response(error.body, {
            status: error.status,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
        });
    }
    else if ('status' in error && typeof error.status === 'number') {
        const body = 'body' in error && typeof error.body === 'string'
            ? error.body
            : JSON.stringify({ error: error.message }, null, 2);
        return new Response(body, {
            status: error.status,
        });
    }
    else {
        return new Response(`${error}`, { status: 500 });
    }
}
//# sourceMappingURL=error.js.map