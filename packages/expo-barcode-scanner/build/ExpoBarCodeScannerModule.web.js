import { PermissionStatus, UnavailabilityError } from 'expo-modules-core';
function getUserMedia(constraints) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    // First get ahold of the legacy getUserMedia, if present
    const getUserMedia = 
    // TODO: this method is deprecated, migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        function () {
            const error = new Error('Permission unimplemented');
            error.code = 0;
            error.name = 'NotAllowedError';
            throw error;
        };
    return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
    });
}
function handleGetUserMediaError({ message }) {
    // name: NotAllowedError
    // code: 0
    if (message === 'Permission dismissed') {
        return {
            status: PermissionStatus.UNDETERMINED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
    else {
        return {
            status: PermissionStatus.DENIED,
            expires: 'never',
            canAskAgain: true,
            granted: false,
        };
    }
}
async function handleRequestPermissionsAsync() {
    try {
        await getUserMedia({
            video: true,
        });
        return {
            status: PermissionStatus.GRANTED,
            expires: 'never',
            canAskAgain: true,
            granted: true,
        };
    }
    catch ({ message }) {
        return handleGetUserMediaError({ message });
    }
}
async function handlePermissionsQueryAsync() {
    if (!navigator?.permissions?.query) {
        throw new UnavailabilityError('expo-barcode-scanner', 'navigator.permissions API is not available');
    }
    const { state } = await navigator.permissions.query({ name: 'camera' });
    switch (state) {
        case 'prompt':
            return {
                status: PermissionStatus.UNDETERMINED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
        case 'granted':
            return {
                status: PermissionStatus.GRANTED,
                expires: 'never',
                canAskAgain: true,
                granted: true,
            };
        case 'denied':
            return {
                status: PermissionStatus.DENIED,
                expires: 'never',
                canAskAgain: true,
                granted: false,
            };
    }
}
export default {
    get name() {
        return 'ExpoBarCodeScannerModule';
    },
    get BarCodeType() {
        return {
            code39mod43: 'code39mod43',
            code138: 'code138',
            interleaved2of5: 'interleaved2of5',
            aztec: 'aztec',
            ean13: 'ean13',
            ean8: 'ean8',
            qr: 'qr',
            pdf417: 'pdf417',
            upc_e: 'upc_e',
            datamatrix: 'datamatrix',
            code39: 'code39',
            code93: 'code93',
            itf14: 'itf14',
            codabar: 'codabar',
            code128: 'code128',
            upc_a: 'upc_a',
        };
    },
    get Type() {
        return { front: 'front', back: 'back' };
    },
    async requestPermissionsAsync() {
        return handleRequestPermissionsAsync();
    },
    async getPermissionsAsync() {
        return handlePermissionsQueryAsync();
    },
};
//# sourceMappingURL=ExpoBarCodeScannerModule.web.js.map