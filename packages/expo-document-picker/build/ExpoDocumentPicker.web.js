import { Platform } from 'expo-modules-core';
export default {
    async getDocumentAsync({ type = '*/*', multiple = false, }) {
        // SSR guard
        if (!Platform.isDOMAvailable) {
            return { canceled: true, assets: null };
        }
        const input = document.createElement('input');
        input.style.display = 'none';
        input.setAttribute('type', 'file');
        input.setAttribute('accept', Array.isArray(type) ? type.join(',') : type);
        input.setAttribute('id', String(Math.random()));
        if (multiple) {
            input.setAttribute('multiple', 'multiple');
        }
        document.body.appendChild(input);
        return new Promise((resolve, reject) => {
            input.addEventListener('change', async () => {
                if (input.files) {
                    const results = [];
                    for (let i = 0; i < input.files.length; i++) {
                        results.push(readFileAsync(input.files[i]));
                    }
                    try {
                        const assets = await Promise.all(results);
                        resolve({ canceled: false, assets, output: input.files });
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                else {
                    resolve({ canceled: true, assets: null });
                }
                document.body.removeChild(input);
            });
            input.addEventListener('cancel', () => {
                resolve({ canceled: true, assets: null });
            });
            const event = new MouseEvent('click');
            input.dispatchEvent(event);
        });
    },
};
function readFileAsync(targetFile) {
    return new Promise((resolve, reject) => {
        const mimeType = targetFile.type;
        const reader = new FileReader();
        reader.onerror = () => {
            reject(new Error(`Failed to read the selected media because the operation failed.`));
        };
        reader.onload = ({ target }) => {
            const uri = target.result;
            resolve({
                uri,
                mimeType,
                name: targetFile.name,
                lastModified: targetFile.lastModified,
                size: targetFile.size,
                file: targetFile,
            });
        };
        // Read in the image file as a binary string.
        reader.readAsDataURL(targetFile);
    });
}
//# sourceMappingURL=ExpoDocumentPicker.web.js.map