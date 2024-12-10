import { PermissionStatus, Platform } from 'expo-modules-core';
import { MediaTypeOptions, } from './ImagePicker.types';
import { parseMediaTypes } from './utils';
const MediaTypeInput = {
    images: 'image/*',
    videos: 'video/mp4,video/quicktime,video/x-m4v,video/*',
    livePhotos: '',
};
export default {
    async launchImageLibraryAsync({ mediaTypes = ['images'], allowsMultipleSelection = false, base64 = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { canceled: true, assets: null };
        }
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
            base64,
        });
    },
    async launchCameraAsync({ mediaTypes = MediaTypeOptions.Images, allowsMultipleSelection = false, base64 = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { canceled: true, assets: null };
        }
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
            capture: true,
            base64,
        });
    },
    /*
     * Delegate to expo-permissions to request camera permissions
     */
    async getCameraPermissionsAsync() {
        return permissionGrantedResponse();
    },
    async requestCameraPermissionsAsync() {
        return permissionGrantedResponse();
    },
    /*
     * Camera roll permissions don't need to be requested on web, so we always
     * respond with granted.
     */
    async getMediaLibraryPermissionsAsync(_writeOnly) {
        return permissionGrantedResponse();
    },
    async requestMediaLibraryPermissionsAsync(_writeOnly) {
        return permissionGrantedResponse();
    },
};
function permissionGrantedResponse() {
    return {
        status: PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
    };
}
function openFileBrowserAsync({ mediaTypes, capture = false, allowsMultipleSelection = false, base64, }) {
    const parsedMediaTypes = parseMediaTypes(mediaTypes);
    const mediaTypeFormat = createMediaTypeFormat(parsedMediaTypes);
    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', mediaTypeFormat);
    input.setAttribute('id', String(Math.random()));
    input.setAttribute('data-testid', 'file-input');
    if (allowsMultipleSelection) {
        input.setAttribute('multiple', 'multiple');
    }
    if (capture) {
        input.setAttribute('capture', 'camera');
    }
    document.body.appendChild(input);
    return new Promise((resolve) => {
        input.addEventListener('change', async () => {
            if (input.files?.length) {
                const files = allowsMultipleSelection ? input.files : [input.files[0]];
                const assets = await Promise.all(Array.from(files).map((file) => readFile(file, { base64 })));
                resolve({ canceled: false, assets });
            }
            else {
                resolve({ canceled: true, assets: null });
            }
            document.body.removeChild(input);
        });
        input.addEventListener('cancel', () => {
            input.dispatchEvent(new Event('change'));
        });
        const event = new MouseEvent('click');
        input.dispatchEvent(event);
    });
}
function readFile(targetFile, options) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
            reject(new Error(`Failed to read the selected media because the operation failed.`));
        };
        reader.onload = ({ target }) => {
            const uri = target.result;
            const returnRaw = () => resolve({ uri, width: 0, height: 0 });
            const returnMediaData = (data) => {
                resolve({
                    ...data,
                    ...(options.base64 && { base64: uri.substr(uri.indexOf(',') + 1) }),
                    file: targetFile,
                });
            };
            if (typeof uri === 'string') {
                if (targetFile.type.startsWith('image/')) {
                    const image = new Image();
                    image.src = uri;
                    image.onload = () => {
                        returnMediaData({
                            uri,
                            width: image.naturalWidth ?? image.width,
                            height: image.naturalHeight ?? image.height,
                            type: 'image',
                            mimeType: targetFile.type,
                            fileName: targetFile.name,
                            fileSize: targetFile.size,
                        });
                    };
                    image.onerror = () => returnRaw();
                }
                else if (targetFile.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.src = uri;
                    video.onloadedmetadata = () => {
                        returnMediaData({
                            uri,
                            width: video.videoWidth,
                            height: video.videoHeight,
                            type: 'video',
                            mimeType: targetFile.type,
                            fileName: targetFile.name,
                            fileSize: targetFile.size,
                            duration: video.duration,
                        });
                    };
                    video.onerror = () => returnRaw();
                }
                else {
                    returnRaw();
                }
            }
            else {
                returnRaw();
            }
        };
        reader.readAsDataURL(targetFile);
    });
}
function createMediaTypeFormat(mediaTypes) {
    const filteredMediaTypes = mediaTypes.filter((mediaType) => mediaType !== 'livePhotos');
    if (filteredMediaTypes.length === 0) {
        return 'image/*';
    }
    let result = '';
    for (const mediaType of filteredMediaTypes) {
        // Make sure the types don't repeat
        if (!result.includes(MediaTypeInput[mediaType])) {
            result = result.concat(',', MediaTypeInput[mediaType]);
        }
    }
    return result;
}
//# sourceMappingURL=ExponentImagePicker.web.js.map