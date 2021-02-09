import * as AssetUris from '../AssetUris';

describe('getFilename', () => {
  it(`gets the filename from a URL`, () => {
    const url =
      'https://d1wp6m56sqw74a.cloudfront.net/~assets/4bd45bcdf50493e345e817c9281bffbf.png';
    expect(AssetUris.getFilename(url)).toBe('4bd45bcdf50493e345e817c9281bffbf.png');
  });

  it(`returns an empty string when the URL has no path`, () => {
    const url = 'https://example.com';
    expect(AssetUris.getFilename(url)).toBe('');
  });
});

describe('getExtension', () => {
  it(`gets the file extension from a URL`, () => {
    const url =
      'https://d1wp6m56sqw74a.cloudfront.net/~assets/4bd45bcdf50493e345e817c9281bffbf.png';
    expect(AssetUris.getFileExtension(url)).toBe('.png');
  });

  it(`returns an empty string when there is no extension`, () => {
    const url = 'https://example.com/';
    expect(AssetUris.getFileExtension(url)).toBe('');
  });

  it(`returns an empty string for hidden files with no extension`, () => {
    const url = 'https://example.com/.hidden';
    expect(AssetUris.getFileExtension(url)).toBe('');
  });

  it(`gets the extension for hidden files with an extension`, () => {
    const url = 'https://example.com/.hidden.txt';
    expect(AssetUris.getFileExtension(url)).toBe('.txt');
  });
});

describe('getManifestBaseUrl', () => {
  it(`returns a URL without the manifest's filename`, () => {
    const manifestUrl = 'https://expo.io/@user/app/index.exp';
    expect(AssetUris.getManifestBaseUrl(manifestUrl)).toBe('https://expo.io/@user/app/');
  });

  it(`returns the same URL when there is no filename`, () => {
    const manifestUrl = 'https://expo.io/@user/app/';
    expect(AssetUris.getManifestBaseUrl(manifestUrl)).toBe('https://expo.io/@user/app/');
  });

  it(`normalizes Expo client URI schemes`, () => {
    const expUrl = 'exp://expo.io/@user/app/index.exp';
    expect(AssetUris.getManifestBaseUrl(expUrl)).toBe('http://expo.io/@user/app/');

    const expsUrl = 'exps://expo.io/@user/app/index.exp';
    expect(AssetUris.getManifestBaseUrl(expsUrl)).toBe('https://expo.io/@user/app/');
  });

  it(`removes query parameters and fragments`, () => {
    const manifestUrl = 'https://expo.io/@user/app/index.exp?query=test#hash';
    expect(AssetUris.getManifestBaseUrl(manifestUrl)).toBe('https://expo.io/@user/app/');
  });
});
