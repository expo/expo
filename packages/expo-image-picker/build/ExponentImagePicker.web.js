import { PermissionStatus } from 'unimodules-permissions-interface';
import { v4 } from 'uuid';
import { Platform } from '@unimodules/core';
import { MediaTypeOptions, } from './ImagePicker.types';
const MediaTypeInput = {
    [MediaTypeOptions.All]: 'video/mp4,video/quicktime,video/x-m4v,video/*,image/*',
    [MediaTypeOptions.Images]: 'image/*',
    [MediaTypeOptions.Videos]: 'video/mp4,video/quicktime,video/x-m4v,video/*',
};
export default {
    get name() {
        return 'ExponentImagePicker';
    },
    async launchImageLibraryAsync({ mediaTypes = MediaTypeOptions.Images, allowsMultipleSelection = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { cancelled: true };
        }
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
        });
    },
    async launchCameraAsync({ mediaTypes = MediaTypeOptions.Images, allowsMultipleSelection = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { cancelled: true };
        }
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
            capture: true,
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
let _isMobile = null;
// https://stackoverflow.com/a/11381730/4047926
function isMobile() {
    if (_isMobile != null) {
        return _isMobile;
    }
    (function (a) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
            _isMobile = true;
        // @ts-ignore
    })(navigator.userAgent || navigator.vendor || window.opera);
    return _isMobile;
}
function openFileBrowserAsync({ mediaTypes, capture = false, allowsMultipleSelection = false, }) {
    const mediaTypeFormat = MediaTypeInput[mediaTypes];
    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', mediaTypeFormat);
    input.setAttribute('id', v4());
    if (allowsMultipleSelection) {
        input.setAttribute('multiple', 'multiple');
    }
    if (capture) {
        // Bug in Safari causes this to crash in Simulators due to the lack of a camera.
        input.setAttribute('capture', 'camera');
    }
    document.body.appendChild(input);
    return new Promise(resolve => {
        let timeout;
        input.addEventListener('change', async () => {
            // First clear the cancel timeout.
            clearTimeout(timeout);
            if (input.files) {
                if (!allowsMultipleSelection) {
                    const img = await readFile(input.files[0]);
                    resolve({
                        cancelled: false,
                        ...img,
                    });
                }
                else {
                    const imgs = await Promise.all(Array.from(input.files).map(readFile));
                    resolve({
                        cancelled: false,
                        selected: imgs,
                    });
                }
            }
            // Clean up
            if (input.parentNode) {
                document.body.removeChild(input);
            }
            document.removeEventListener('visibilitychange', eventListener);
            document.removeEventListener('focusin', eventListener);
        });
        const eventListener = () => {
            const isVisible = document.visibilityState === 'visible';
            if (!isVisible) {
                return;
            }
            // Chrome on Android can invoke both events when the camera is cancelled, so we must unmount the events quickly.
            document.removeEventListener('visibilitychange', eventListener);
            document.removeEventListener('focusin', eventListener);
            // Browser hack: Wrap in a setTimeout because this method gets called before the input change event.
            // This works with +1gb videos on desktop reliably, but mobile browsers struggle so give them an absurd timeout.
            // Tested against
            // - Desktop Chrome on 16" 2020 MacBook Pro with 1gb video.
            // - iOS Safari on iPhone 12 Pro Max with 27s video.
            // - Android Chrome on Pixel 2. This doesn't work for photo picking, seemingly all other variations work as expected.
            const duration = isMobile() ? 3000 : 300;
            timeout = setTimeout(() => {
                if (!input.value.length) {
                    resolve({ cancelled: true });
                }
                // Clean up
                if (input.parentNode) {
                    document.body.removeChild(input);
                }
            }, duration);
        };
        // Use visibilitychange for mobile safari
        document.addEventListener('visibilitychange', eventListener);
        document.addEventListener('focusin', eventListener);
        // Seemingly works better than `input.click();`
        const event = new MouseEvent('click');
        input.dispatchEvent(event);
    });
}
function readFile(targetFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
            reject(new Error(`Failed to read the selected media because the operation failed.`));
        };
        reader.onload = ({ target }) => {
            const uri = target.result;
            const returnRaw = () => resolve({
                uri,
                width: 0,
                height: 0,
            });
            if (typeof target?.result === 'string') {
                const image = new Image();
                image.src = target.result;
                image.onload = () => resolve({
                    uri,
                    width: image.naturalWidth ?? image.width,
                    height: image.naturalHeight ?? image.height,
                });
                image.onerror = () => returnRaw();
            }
            else {
                returnRaw();
            }
        };
        reader.readAsDataURL(targetFile);
    });
}
//# sourceMappingURL=ExponentImagePicker.web.js.map