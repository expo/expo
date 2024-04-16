import * as React from 'react';
import { captureImageData } from './WebCameraUtils';
const qrWorkerMethod = ({ data, width, height }) => {
    // eslint-disable-next-line no-undef
    const decoded = self.jsQR(data, width, height, {
        inversionAttempts: 'attemptBoth',
    });
    let parsed;
    try {
        parsed = JSON.parse(decoded);
    }
    catch {
        parsed = decoded;
    }
    if (parsed?.data) {
        const nativeEvent = {
            type: 'qr',
            data: parsed.data,
            cornerPoints: [],
            bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
        };
        if (parsed.location) {
            nativeEvent.cornerPoints = [
                parsed.location.topLeftCorner,
                parsed.location.bottomLeftCorner,
                parsed.location.topRightCorner,
                parsed.location.bottomRightCorner,
            ];
        }
        return nativeEvent;
    }
    return parsed;
};
const createWorkerAsyncFunction = (fn, deps) => {
    if (typeof window === 'undefined') {
        return async () => {
            throw new Error('Cannot use createWorkerAsyncFunction in a non-browser environment');
        };
    }
    const stringifiedFn = [
        `self.func = ${fn.toString()};`,
        'self.onmessage = (e) => {',
        '  const result = self.func(e.data);',
        '  self.postMessage(result);',
        '};',
    ];
    if (deps.length > 0) {
        stringifiedFn.unshift(`importScripts(${deps.map((dep) => `'${dep}'`).join(', ')});`);
    }
    const blob = new Blob(stringifiedFn, { type: 'text/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    // First-In First-Out queue of promises
    const promises = [];
    worker.onmessage = (e) => promises.shift()?.resolve(e.data);
    return (data) => {
        return new Promise((resolve, reject) => {
            promises.push({ resolve, reject });
            worker.postMessage(data);
        });
    };
};
const decode = createWorkerAsyncFunction(qrWorkerMethod, [
    'https://cdn.jsdelivr.net/npm/jsqr@1.2.0/dist/jsQR.min.js',
]);
export function useWebQRScanner(video, { isEnabled, captureOptions, interval, onScanned, onError, }) {
    const isRunning = React.useRef(false);
    const timeout = React.useRef(undefined);
    async function scanAsync() {
        // If interval is 0 then only scan once.
        if (!isRunning.current || !onScanned) {
            stop();
            return;
        }
        try {
            const data = captureImageData(video.current, captureOptions);
            if (data) {
                const nativeEvent = await decode(data);
                if (nativeEvent?.data) {
                    onScanned({
                        nativeEvent,
                    });
                }
            }
        }
        catch (error) {
            if (onError) {
                onError({ nativeEvent: error });
            }
        }
        finally {
            // If interval is 0 then only scan once.
            if (interval === 0) {
                stop();
                return;
            }
            const intervalToUse = !interval || interval < 0 ? 16 : interval;
            // @ts-ignore: Type 'Timeout' is not assignable to type 'number'
            timeout.current = setTimeout(() => {
                scanAsync();
            }, intervalToUse);
        }
    }
    function stop() {
        isRunning.current = false;
        clearTimeout(timeout.current);
    }
    React.useEffect(() => {
        if (isEnabled) {
            isRunning.current = true;
            scanAsync();
        }
        return () => {
            if (isEnabled) {
                stop();
            }
        };
    }, [isEnabled]);
}
//# sourceMappingURL=useWebQRScanner.js.map