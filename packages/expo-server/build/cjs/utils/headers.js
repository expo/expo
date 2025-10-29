"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendHeadersRecord = void 0;
const appendHeadersRecord = (headers, updateHeaders, shouldOverwrite) => {
    for (const headerName in updateHeaders) {
        if (Array.isArray(updateHeaders[headerName])) {
            for (const headerValue of updateHeaders[headerName]) {
                headers.append(headerName, headerValue);
            }
        }
        else if (!shouldOverwrite && headers.has(headerName)) {
            continue;
        }
        else if (updateHeaders[headerName] != null) {
            headers.set(headerName, updateHeaders[headerName]);
        }
    }
};
exports.appendHeadersRecord = appendHeadersRecord;
//# sourceMappingURL=headers.js.map