import uuidv4 from 'uuid/v4';
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
    async launchImageLibraryAsync({ mediaTypes = MediaTypeOptions.All, allowsMultipleSelection = false, }) {
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
        });
    },
    async launchCameraAsync({ mediaTypes = MediaTypeOptions.All, allowsMultipleSelection = false, }) {
        return await openFileBrowserAsync({
            mediaTypes,
            allowsMultipleSelection,
            capture: true,
        });
    },
};
function openFileBrowserAsync({ mediaTypes, capture = false, allowsMultipleSelection = false, }) {
    const mediaTypeFormat = MediaTypeInput[mediaTypes];
    const input = document.createElement('input');
    input.style.display = 'none';
    input.setAttribute('type', 'file');
    input.setAttribute('accept', mediaTypeFormat);
    input.setAttribute('id', uuidv4());
    if (allowsMultipleSelection) {
        input.setAttribute('multiple', 'multiple');
    }
    if (capture) {
        input.setAttribute('capture', 'camera');
    }
    document.body.appendChild(input);
    return new Promise((resolve, reject) => {
        input.addEventListener('change', () => {
            if (input.files) {
                const targetFile = input.files[0];
                const reader = new FileReader();
                reader.onerror = () => {
                    reject('Failed to read the selected media because the operation failed.');
                };
                reader.onload = ({ target }) => {
                    const uri = target.result;
                    
                    let type;
                    if (targetFile.type && targetFile.type.startsWith('image/')) type = 'image';
                    if (targetFile.type && targetFile.type.startsWith('video/')) type = 'video';
                    
                    // todo: get image width/height with https://stackoverflow.com/a/13572209/3273806
                    // todo: get video width/height with https://stackoverflow.com/a/45355068/3273806
                    
                    resolve({
                        cancelled: false,
                        type,
                        uri,
                        width: 0,
                        height: 0,
                        
                        // possibly provide a reference to the raw file
                        // so that File.{lastModified, lastModifiedDate, name, webkitRelativePath, size, type}
                        // are available
                        // file: targetFile,
                    });
                };
                // Read in the image file as a binary string.
                reader.readAsDataURL(targetFile);
            }
            else {
                resolve({ cancelled: true });
            }
            document.body.removeChild(input);
        });
        const event = new MouseEvent('click');
        input.dispatchEvent(event);
    });
}
//# sourceMappingURL=ExponentImagePicker.web.js.map
