import VideoThumbnailWeb from './VideoThumbnail.web';
const JPEG_MIME_TYPE = 'image/jpeg';
const JPEG_TIME_EPSILON_SECONDS = 0.001;
const HAVE_CURRENT_DATA = 2;
export async function generateVideoThumbnailsAsync(source, times, options = {}) {
    const requestedTimes = normalizeRequestedTimes(times);
    if (requestedTimes.length === 0) {
        return [];
    }
    const resolvedSource = await resolveVideoSourceAsync(source);
    const video = createVideoElement(resolvedSource.uri, resolvedSource.shouldUseAnonymousCors);
    try {
        await waitForVideoMetadataAsync(video);
        const sizeLimit = resolveSizeLimit(options);
        const requestedThumbnails = prepareRequestedThumbnails(requestedTimes, video.duration);
        const renderer = createThumbnailRenderer(video, sizeLimit);
        const thumbnails = new Array(requestedThumbnails.length);
        let cachedFrame = null;
        for (const thumbnail of requestedThumbnails) {
            const renderedFrame = await renderFrameAsync(video, thumbnail.targetTime, renderer, cachedFrame);
            cachedFrame = renderedFrame;
            thumbnails[thumbnail.originalIndex] = renderer.render(thumbnail.requestedTime, renderedFrame.actualTime, renderedFrame.uri);
        }
        return thumbnails;
    }
    finally {
        cleanupVideoElement(video);
        resolvedSource.release();
    }
}
async function resolveVideoSourceAsync(source) {
    const headers = source.headers ?? {};
    if (Object.keys(headers).length === 0 || !isHttpSource(source.uri)) {
        return {
            uri: source.uri,
            release: () => { },
            shouldUseAnonymousCors: isHttpSource(source.uri),
        };
    }
    const response = await fetch(source.uri, { headers });
    if (!response.ok) {
        throw new Error(`Failed to fetch the video source. Received HTTP ${response.status}.`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    return {
        uri: objectUrl,
        release: () => URL.revokeObjectURL(objectUrl),
        shouldUseAnonymousCors: false,
    };
}
function createVideoElement(sourceUri, shouldUseAnonymousCors) {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    if (shouldUseAnonymousCors) {
        video.crossOrigin = 'anonymous';
    }
    video.src = sourceUri;
    video.load();
    return video;
}
async function waitForVideoMetadataAsync(video) {
    if (video.readyState >= HAVE_CURRENT_DATA) {
        return;
    }
    await waitForEventAsync(video, 'loadeddata');
}
async function waitForVideoFrameAsync(video, targetTimeSeconds) {
    if (video.readyState < HAVE_CURRENT_DATA) {
        await waitForEventAsync(video, 'loadeddata');
    }
    if (Math.abs(video.currentTime - targetTimeSeconds) < JPEG_TIME_EPSILON_SECONDS) {
        return Math.max(0, video.currentTime);
    }
    const seekPromise = waitForEventAsync(video, 'seeked');
    video.currentTime = targetTimeSeconds;
    await seekPromise;
    return Math.max(0, video.currentTime);
}
function createThumbnailRenderer(video, sizeLimit) {
    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        throw new Error('Failed to generate a thumbnail because the video dimensions are unavailable.');
    }
    const { width, height } = resolveThumbnailDimensions(video.videoWidth, video.videoHeight, sizeLimit);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context == null) {
        throw new Error('Failed to generate a thumbnail because the canvas context is unavailable.');
    }
    return {
        width: canvas.width,
        height: canvas.height,
        render(requestedTime, actualTime, uri) {
            return VideoThumbnailWeb.init({
                uri,
                width: canvas.width,
                height: canvas.height,
                requestedTime,
                actualTime,
            });
        },
        renderUri() {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                return canvas.toDataURL(JPEG_MIME_TYPE);
            }
            catch {
                throw new Error('Failed to generate a thumbnail because the video source is not readable on web. Make sure the source is same-origin or CORS-enabled.');
            }
        },
    };
}
function resolveThumbnailDimensions(width, height, sizeLimit) {
    if (sizeLimit == null) {
        return { width, height };
    }
    const ratio = Math.max(width / sizeLimit.maxWidth, height / sizeLimit.maxHeight);
    if (ratio <= 1) {
        return { width, height };
    }
    return {
        width: Math.max(1, Math.floor(width / ratio)),
        height: Math.max(1, Math.floor(height / ratio)),
    };
}
function cleanupVideoElement(video) {
    try {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }
    catch {
        // Best-effort cleanup to release browser media resources.
    }
}
function normalizeRequestedTimes(times) {
    const requestedTimes = Array.isArray(times) ? times : [times];
    return requestedTimes
        .filter((time) => typeof time === 'number' && Number.isFinite(time))
        .map((time) => Math.max(0, time));
}
function prepareRequestedThumbnails(requestedTimes, durationSeconds) {
    const thumbnails = requestedTimes.map((requestedTime, originalIndex) => ({
        originalIndex,
        requestedTime,
        targetTime: clampSeekTimeToDuration(requestedTime, durationSeconds),
    }));
    if (thumbnails.length <= 1) {
        return thumbnails;
    }
    return thumbnails.sort((left, right) => left.targetTime - right.targetTime);
}
async function renderFrameAsync(video, targetTime, renderer, cachedFrame) {
    if (cachedFrame != null &&
        Math.abs(cachedFrame.targetTime - targetTime) < JPEG_TIME_EPSILON_SECONDS) {
        return cachedFrame;
    }
    const actualTime = await waitForVideoFrameAsync(video, targetTime);
    return {
        targetTime,
        actualTime,
        uri: renderer.renderUri(),
    };
}
function resolveSizeLimit(options) {
    if (options.maxWidth == null && options.maxHeight == null) {
        return null;
    }
    if ((options.maxWidth != null && (!Number.isFinite(options.maxWidth) || options.maxWidth < 1)) ||
        (options.maxHeight != null && (!Number.isFinite(options.maxHeight) || options.maxHeight < 1))) {
        throw new Error('Failed to generate a thumbnail: The maxWidth and maxHeight parameters must be greater than zero.');
    }
    return {
        maxWidth: options.maxWidth ?? Number.POSITIVE_INFINITY,
        maxHeight: options.maxHeight ?? Number.POSITIVE_INFINITY,
    };
}
function clampSeekTimeToDuration(requestedTimeSeconds, durationSeconds) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return requestedTimeSeconds;
    }
    return Math.min(requestedTimeSeconds, Math.max(durationSeconds - JPEG_TIME_EPSILON_SECONDS, 0));
}
function isHttpSource(sourceUri) {
    try {
        const url = new URL(sourceUri, window.location.href);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
function waitForEventAsync(video, eventName) {
    return new Promise((resolve, reject) => {
        const onSuccess = () => {
            cleanup();
            resolve();
        };
        const onError = () => {
            cleanup();
            reject(new Error('Failed to load the video frame required to generate a thumbnail.'));
        };
        const cleanup = () => {
            video.removeEventListener(eventName, onSuccess);
            video.removeEventListener('error', onError);
        };
        video.addEventListener(eventName, onSuccess, { once: true });
        video.addEventListener('error', onError, { once: true });
    });
}
//# sourceMappingURL=VideoThumbnailGenerator.web.js.map