import { processLockScreenMetadata } from '../ExpoAudio';

describe('processLockScreenMetadata', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should return null or undefined metadata unchanged', () => {
    expect(processLockScreenMetadata(null)).toBeNull();
    expect(processLockScreenMetadata(undefined)).toBeUndefined();
  });

  it('should return metadata unchanged when artworkUrl is undefined or omitted', () => {
    const metadata = { title: 'Track Title', artist: 'Artist' };
    expect(processLockScreenMetadata(metadata)).toEqual(metadata);
    expect(warnSpy).not.toHaveBeenCalled();

    const metadataWithUndefined = { title: 'Track Title', artworkUrl: undefined };
    expect(processLockScreenMetadata(metadataWithUndefined)).toEqual(metadataWithUndefined);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should keep valid HTTP/HTTPS artworkUrl strings', () => {
    const metadataHttp = { title: 'Track', artworkUrl: 'http://example.com/cover.png' };
    expect(processLockScreenMetadata(metadataHttp)).toEqual(metadataHttp);
    expect(warnSpy).not.toHaveBeenCalled();

    const metadataHttps = { title: 'Track', artworkUrl: 'https://example.com/cover.png' };
    expect(processLockScreenMetadata(metadataHttps)).toEqual(metadataHttps);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should keep valid file:// artworkUrl strings', () => {
    const metadataFile = { title: 'Track', artworkUrl: 'file:///path/to/cover.png' };
    expect(processLockScreenMetadata(metadataFile)).toEqual(metadataFile);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should resolve numeric local asset IDs (e.g. require())', () => {
    const metadataRequire = { title: 'Track', artworkUrl: 1 };
    const result = processLockScreenMetadata(metadataRequire);
    expect(result.artworkUrl).toBeDefined();
    expect(typeof result.artworkUrl).toBe('string');
  });

  it('should warn and remove artworkUrl when a bare asset name without protocol is provided', () => {
    const metadataBare = { title: 'Track', artworkUrl: 'bare_icon_name' };
    const result = processLockScreenMetadata(metadataBare);
    expect(result.artworkUrl).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid or unsupported data provided for 'artworkUrl'")
    );
  });

  it('should warn and remove artworkUrl when artworkUrl is an unsupported type', () => {
    const metadataBool = { title: 'Track', artworkUrl: true };
    const result = processLockScreenMetadata(metadataBool);
    expect(result.artworkUrl).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid or unsupported data provided for 'artworkUrl'")
    );
  });
});
