import ExpoAppIntegrity from '../ExpoAppIntegrity';

describe('Native', () => {
  it(`invokes generateKeyAsync native method correctly`, async () => {
    const key = await ExpoAppIntegrity.generateKeyAsync();
    expect(key).toBe('mock-key');
    expect(ExpoAppIntegrity.generateKeyAsync).toHaveBeenCalledTimes(1);
  });

  it(`invokes attestKeyAsync native method correctly`, async () => {
    const key = 'test-key';
    const challenge = 'test-challenge';
    const attestation = await ExpoAppIntegrity.attestKeyAsync(key, challenge);
    expect(typeof attestation).toBe('string');
    expect(ExpoAppIntegrity.attestKeyAsync).toHaveBeenLastCalledWith(key, challenge);
  });

  it(`invokes generateAssertionAsync native method correctly`, async () => {
    (ExpoAppIntegrity.generateAssertionAsync as jest.Mock).mockResolvedValue('mock-assertion');
    const key = 'test-key';
    const payload = JSON.stringify({ timestamp: Date.now() });
    const assertion = await ExpoAppIntegrity.generateAssertionAsync(key, payload);
    expect(typeof assertion).toBe('string');
    expect(ExpoAppIntegrity.generateAssertionAsync).toHaveBeenLastCalledWith(key, payload);
  });

  it(`invokes requestIntegrityCheckAsync native method correctly`, async () => {
    const challenge = 'test-challenge';
    const integrityCheck = await ExpoAppIntegrity.requestIntegrityCheckAsync(challenge);
    expect(typeof integrityCheck).toBe('string');
    expect(ExpoAppIntegrity.requestIntegrityCheckAsync).toHaveBeenLastCalledWith(challenge);
  });

  it(`invokes prepareIntegrityTokenProviderAsync native method correctly`, async () => {
    const cloudProjectNumber = '1234567890';
    const value = await ExpoAppIntegrity.prepareIntegrityTokenProviderAsync(cloudProjectNumber);
    expect(value).toBe(undefined);
    expect(ExpoAppIntegrity.prepareIntegrityTokenProviderAsync).toHaveBeenLastCalledWith(
      cloudProjectNumber
    );
  });
});
