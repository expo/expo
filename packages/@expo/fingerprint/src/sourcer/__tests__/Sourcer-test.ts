import { normalizeOptions } from '../../Options';
import { getHashSourcesAsync } from '../Sourcer';

describe(getHashSourcesAsync, () => {
  it('should include `extraSources` from input parameter', async () => {
    const sources = await getHashSourcesAsync(
      '/app',
      normalizeOptions({
        extraSources: [{ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] }],
      })
    );
    expect(sources).toContainEqual({ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] });
  });
});
