import * as React from 'react';
import * as WebBarcodeScanner from './WebBarcodeScanner';
/**
 * Map barcode coordinates from the video's intrinsic resolution to the
 * view's layout dimensions, matching native behavior (simple proportional mapping).
 */
function mapToViewCoordinates(result, videoWidth, videoHeight, viewWidth, viewHeight, isMirrored) {
    const scaleX = viewWidth / videoWidth;
    const scaleY = viewHeight / videoHeight;
    const mapPoint = (p) => {
        const x = isMirrored ? viewWidth - p.x * scaleX : p.x * scaleX;
        const y = p.y * scaleY;
        return { x, y };
    };
    const origin = mapPoint(result.bounds.origin);
    const size = {
        width: result.bounds.size.width * scaleX,
        height: result.bounds.size.height * scaleY,
    };
    if (isMirrored) {
        origin.x -= size.width;
    }
    return {
        ...result,
        bounds: { origin, size },
        cornerPoints: result.cornerPoints.map(mapPoint),
    };
}
export function useWebBarcodeScanner(video, { isEnabled, barcodeTypes, interval, isMirrored = false, onScanned, onError, }) {
    const isRunning = React.useRef(false);
    const timeout = React.useRef(undefined);
    async function scanAsync() {
        if (!isRunning.current || !onScanned) {
            stop();
            return;
        }
        try {
            const videoEl = video.current;
            if (!videoEl || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
                return;
            }
            const { videoWidth, videoHeight } = videoEl;
            if (!videoWidth || !videoHeight) {
                return;
            }
            const bitmap = await createImageBitmap(videoEl);
            const results = await WebBarcodeScanner.detect(bitmap, barcodeTypes);
            bitmap.close();
            // Use the video element's rendered size as the view dimensions
            const viewWidth = videoEl.clientWidth || videoWidth;
            const viewHeight = videoEl.clientHeight || videoHeight;
            for (const raw of results) {
                const nativeEvent = mapToViewCoordinates(raw, videoWidth, videoHeight, viewWidth, viewHeight, isMirrored);
                onScanned({ nativeEvent });
            }
        }
        catch (error) {
            if (__DEV__) {
                console.warn('expo-camera: barcode scanning error', error);
            }
            if (onError) {
                onError({ nativeEvent: error });
            }
        }
        finally {
            if (interval === 0) {
                stop();
                return;
            }
            const intervalToUse = !interval || interval < 0 ? 16 : interval;
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
//# sourceMappingURL=useWebBarcodeScanner.js.map