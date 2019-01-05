import { GetDocumentOptions, DocumentResult } from './DocumentPicker.types';

export default {
  get name(): string {
    return 'ExponentDocumentPicker';
  },

  async getDocumentAsync({
    type = '*/*',
    multiple = false,
  }: GetDocumentOptions): Promise<DocumentResult> {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', type);
    input.setAttribute('id', 'hidden-file');
    if (multiple) input.setAttribute('multiple', '');

    input.style.display = 'none';

    document.body.appendChild(input);

    return new Promise((resolve, reject) => {
      input.addEventListener('change', () => {
        if (input.files) {
          const targetFile = input.files[0];
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onabort = reject;
          reader.onload = ({ target }) => {
            const uri = (target as any).result;
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
        } else {
          resolve({ type: 'cancel' });
        }

        document.body.removeChild(input);
      });

      const event = document.createEvent('MouseEvents');
      event.initMouseEvent(
        'click',
        true,
        true,
        window,
        1,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null
      );
      input.dispatchEvent(event);
    });
  },
};
