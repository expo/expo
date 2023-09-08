import { normalizeOptionsAsync } from '../../Options';
import { getHashSourcesAsync } from '../Sourcer';

describe(getHashSourcesAsync, () => {
  it('should include `extraSources` from input parameter', async () => {
    const sources = await getHashSourcesAsync(
      '/app',
      await normalizeOptionsAsync('/app', {
        extraSources: [{ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] }],
      })
    );
    expect(sources).toContainEqual({ type: 'dir', filePath: '/app/scripts', reasons: ['extra'] });
  });
});
