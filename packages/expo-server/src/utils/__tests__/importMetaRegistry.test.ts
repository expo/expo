import { importMetaRegistry } from '../importMetaRegistry';

describe('importMetaRegistry', () => {
  it('provides mock `url` param', async () => {
    const { url } = importMetaRegistry;
    expect(url).toMatch(/^file:\/\/\//);
  });
});
