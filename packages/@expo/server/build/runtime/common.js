"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiRouteError = exports.logApiRouteExecutionError = void 0;
const logApiRouteExecutionError = () => (error) => {
    console.error(error);
};
exports.logApiRouteExecutionError = logApiRouteExecutionError;
const handleApiRouteError = () => async (error) => {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
        return new Response(error.message, {
            status: error.statusCode,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
    return new Response('Internal server error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
    });
};
exports.handleApiRouteError = handleApiRouteError;
//# sourceMappingURL=common.js.map