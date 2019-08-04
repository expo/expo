import Linking from '../Linking/Linking';

describe('Linking', () => {
  describe('parse', () => {
    it('parses a full url into path and query params', async () => {
      let { path, queryParams } = Linking.parse('https://expo.com/test/path?query=param');
      expect(path).toEqual('test/path');
      expect(queryParams).toEqual({ query: 'param' });
    });
  });
});
