import { Platform } from '@unimodules/core';
import { v4 as uuidv4 } from 'uuid';
export default {
    get name() {
        return 'ExpoDocumentPicker';
    },
    async getDocumentAsync({ type = '*/*', multiple = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { type: 'cancel' };
        }
        const input = document.createElement('input');
        input.style.display = 'none';
        input.setAttribute('type', 'file');
        input.setAttribute('accept', type);
        input.setAttribute('id', uuidv4());
        if (multiple) {
            input.setAttribute('multiple', 'multiple');
        }
        document.body.appendChild(input);
        return new Promise((resolve, reject) => {
            input.addEventListener('change', () => {
                if (input.files) {
                    const targetFile = input.files[0];
                    const reader = new FileReader();
                    reader.onerror = () => {
                        reject(new Error(`Failed to read the selected media because the operation failed.`));
                    };
                    reader.onload = ({ target }) => {
                        const uri = target.result;
                        resolve({
                            type: 'success',
                            uri,
                            name: targetFile.name,
                            file: targetFile,
                            lastModified: targetFile.lastModified,
                            size: targetFile.size,
                            output: input.files,
                        });
                    };
                    // Read in the image file as a binary string.
                    reader.readAsDataURL(targetFile);
                }
                else {
                    resolve({ type: 'cancel' });
                }
                document.body.removeChild(input);
            });
            const event = new MouseEvent('click');
            input.dispatchEvent(event);
        });
    },
};
//# sourceMappingURL=ExpoDocumentPicker.web.js.map