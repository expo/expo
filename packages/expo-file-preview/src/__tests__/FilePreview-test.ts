import ExpoFilePreview from '../ExpoFilePreview';
import * as FilePreview from '../FilePreview';

jest.mock('../ExpoFilePreview', () => ({
  canPreviewAsync: jest.fn(async () => true),
  openPreviewAsync: jest.fn(async () => undefined),
}));

describe('FilePreview', () => {
  it('checks whether a local file can be previewed', async () => {
    await expect(
      FilePreview.canPreviewAsync('file:///tmp/test.pdf', { mimeType: 'application/pdf' })
    ).resolves.toBe(true);

    expect(ExpoFilePreview.canPreviewAsync).toHaveBeenCalledWith('file:///tmp/test.pdf', {
      mimeType: 'application/pdf',
    });
  });

  it('opens a local file preview', async () => {
    await expect(
      FilePreview.openPreviewAsync('file:///tmp/test.pdf', { title: 'Test' })
    ).resolves.toBeUndefined();

    expect(ExpoFilePreview.openPreviewAsync).toHaveBeenCalledWith('file:///tmp/test.pdf', {
      title: 'Test',
    });
  });
});
