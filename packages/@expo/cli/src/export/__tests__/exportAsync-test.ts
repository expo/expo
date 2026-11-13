import { exportAppAsync } from '../exportApp';
import { exportAsync } from '../exportAsync';
import type { Options } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../start/server/metro/debugging/attachAtlas', () => ({
  waitUntilAtlasExportIsReadyAsync: jest.fn(),
}));
jest.mock('../../utils/FileNotifier', () => ({ FileNotifier: { stopAll: jest.fn() } }));
jest.mock('../../utils/dir', () => ({ ensureDirectoryAsync: jest.fn(), removeAsync: jest.fn() }));
jest.mock('../../utils/exit', () => ({ ensureProcessExitsAfterDelay: jest.fn() }));
jest.mock('../../utils/interactive', () => ({ isInteractive: () => true }));
jest.mock('../exportApp', () => ({ exportAppAsync: jest.fn() }));

it('reports working while exporting and done after', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  let writesWhileExporting: unknown[][] = [];
  jest.mocked(exportAppAsync).mockImplementation(async () => {
    writesWhileExporting = [...write.mock.calls];
  });

  try {
    await exportAsync('/app', { outputDir: 'dist' } as Options);

    expect(writesWhileExporting).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=RXhwb3J0aW5nIGFwcA==:id=1\x1b\\'],
    ]);
    expect(write.mock.calls).toEqual([
      ['\x1b]7501;state=working:app=expo:msg=RXhwb3J0aW5nIGFwcA==:id=1\x1b\\'],
      ['\x1b]7501;state=clear:id=1\x1b\\'],
      ['\x1b]7501;state=done:app=expo:msg=RXhwb3J0ZWQ6IGRpc3Q=\x1b\\'],
    ]);
  } finally {
    write.mockRestore();
  }
});
