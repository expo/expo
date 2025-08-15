import ExpoAppIntegrity from '../ExpoAppIntegrity';

describe('Native', () => {
  it(`invokes generateKey native method correctly`, async () => {
    const key = await ExpoAppIntegrity.generateKey();
    expect(key).toBe('mock-key');
    expect(ExpoAppIntegrity.generateKey).toHaveBeenCalledTimes(1);
  });

  it(`invokes attestKey native method correctly`, async () => {
    const key = 'test-key';
    const challenge = 'test-challenge';
    const attestation = await ExpoAppIntegrity.attestKey(key, challenge);
    expect(typeof attestation).toBe('string');
    expect(ExpoAppIntegrity.attestKey).toHaveBeenLastCalledWith(key, challenge);
  });

  it(`invokes generateAssertion native method correctly`, async () => {
    (ExpoAppIntegrity.generateAssertion as jest.Mock).mockResolvedValue('mock-assertion');
    const key = 'test-key';
    const payload = JSON.stringify({ timestamp: Date.now() });
    const assertion = await ExpoAppIntegrity.generateAssertion(key, payload);
    expect(typeof assertion).toBe('string');
    expect(ExpoAppIntegrity.generateAssertion).toHaveBeenLastCalledWith(key, payload);
  });

  it(`invokes requestIntegrityCheck native method correctly`, async () => {
    const challenge = 'test-challenge';
    const integrityCheck = await ExpoAppIntegrity.requestIntegrityCheck(challenge);
    expect(typeof integrityCheck).toBe('string');
    expect(ExpoAppIntegrity.requestIntegrityCheck).toHaveBeenLastCalledWith(challenge);
  });

  it(`invokes prepareIntegrityTokenProvider native method correctly`, async () => {
    const cloudProjectNumber = '1234567890';
    const value = await ExpoAppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
    expect(value).toBe(undefined);
    expect(ExpoAppIntegrity.prepareIntegrityTokenProvider).toHaveBeenLastCalledWith(
      cloudProjectNumber
    );
  });
});
