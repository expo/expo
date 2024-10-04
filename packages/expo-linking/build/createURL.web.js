export function createURL(path, { queryParams = {} } = {}) {
    if (typeof window === 'undefined')
        return '';
    const url = new URL(path, window.location.origin);
    Object.entries(queryParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
            url.searchParams.set(key, encodeURIComponent(value));
        }
        else if (value != null) {
            url.searchParams.set(key, 
            // @ts-expect-error: browser supports using array
            value);
        }
    });
    return url.toString().replace(/\/$/, '');
}
export function parse(url) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        if (typeof window === 'undefined') {
            return {
                hostname: null,
                path: url,
                queryParams: {},
                scheme: null,
            };
        }
        return {
            hostname: 'localhost',
            path: url,
            queryParams: {},
            scheme: 'http',
        };
    }
    const queryParams = {};
    parsed.searchParams.forEach((value, key) => {
        queryParams[key] = decodeURIComponent(value);
    });
    return {
        hostname: parsed.hostname || null,
        // TODO: We should probably update native to follow the default URL behavior closer.
        path: !parsed.hostname && !parsed.pathname
            ? null
            : parsed.pathname === ''
                ? null
                : parsed.pathname.replace(/^\//, ''),
        queryParams,
        scheme: parsed.protocol.replace(/:$/, ''),
    };
}
//# sourceMappingURL=createURL.web.js.map