/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 dai-shi.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/f9111ed7d96c95d7e128b37e8f7ae2d80122218e/packages/waku/src/lib/middleware/rsc.ts#L1
 */
export const decodeInput = (encodedInput) => {
    if (encodedInput === 'index.txt') {
        return '';
    }
    if (encodedInput?.endsWith('.txt')) {
        return encodedInput.slice(0, -'.txt'.length);
    }
    const err = new Error('Invalid encoded input');
    err.statusCode = 400;
    throw err;
};
// Production / Development API Route for handling RSC. Must be applied to the RSC paths, e.g. `/_flight/[...slug]+api.tsx`
export function getRscMiddleware(options) {
    let rscPathPrefix = options.rscPath;
    if (rscPathPrefix !== '/' && !rscPathPrefix.endsWith('/')) {
        rscPathPrefix += '/';
    }
    async function getOrPostAsync(req) {
        const url = new URL(req.url);
        const { method } = req;
        if (method !== 'GET' && method !== 'POST') {
            throw new Error(`Unsupported method '${method}'`);
        }
        const platform = url.searchParams.get('platform') ?? req.headers.get('expo-platform');
        if (typeof platform !== 'string' || !platform) {
            return new Response('Missing expo-platform header or platform query parameter', {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        const engine = url.searchParams.get('transform.engine');
        // TODO: Will the hermes flag apply in production later?
        if (engine && !['hermes'].includes(engine)) {
            return new Response(`Query parameter "transform.engine" is an unsupported value: ${engine}`, {
                status: 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        let encodedInput = url.pathname.replace(
        // TODO: baseUrl support
        rscPathPrefix, '');
        // First segment should be the target platform.
        // This is used for aligning with production exports which are statically exported to a single location at build-time.
        encodedInput = encodedInput.replace(new RegExp(`^${platform}/`), '');
        try {
            encodedInput = decodeInput(encodedInput);
        }
        catch {
            return new Response(`Invalid encoded input: "${encodedInput}"`, {
                status: 400,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        try {
            const args = {
                config: options.config,
                platform,
                engine: engine,
                input: encodedInput,
                searchParams: url.searchParams,
                method,
                body: req.body,
                contentType: req.headers.get('Content-Type') ?? '',
                decodedBody: req.headers.get('X-Expo-Params'),
                onError: options.onError,
                headers: headersToRecord(req.headers),
            };
            const readable = await options.renderRsc(args);
            return new Response(readable, {
                headers: {
                    // The response is a streamed text file
                    'Content-Type': 'text/plain',
                },
            });
        }
        catch (err) {
            if (err instanceof Response) {
                return err;
            }
            if (process.env.NODE_ENV !== 'development') {
                throw err;
            }
            console.error(err);
            return new Response(`Unexpected server error rendering RSC: ` + err.message, {
                status: 'statusCode' in err ? err.statusCode : 500,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
    }
    return {
        GET: getOrPostAsync,
        POST: getOrPostAsync,
    };
}
function headersToRecord(headers) {
    const record = {};
    for (const [key, value] of headers.entries()) {
        record[key] = value;
    }
    return record;
}
//# sourceMappingURL=rsc.js.map