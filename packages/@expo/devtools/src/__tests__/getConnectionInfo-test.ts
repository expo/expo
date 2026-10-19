import { getBundleOrigin } from 'expo/internal/bundle-origin';

import { PROTOCOL_VERSION } from '../ProtocolVersion';
import { getConnectionInfo } from '../getConnectionInfo.native';

jest.mock('expo/internal/bundle-origin', () => ({
  getBundleOrigin: jest.fn(),
}));

describe(getConnectionInfo, () => {
  beforeEach(() => {
    jest.mocked(getBundleOrigin).mockReset();
  });

  it('uses the bundle origin', () => {
    jest.mocked(getBundleOrigin).mockReturnValue('https://proxy.test:4443');

    expect(getConnectionInfo()).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'proxy.test:4443',
      useWss: true,
    });
  });

  it('uses localhost when the bundle origin is not available', () => {
    jest.mocked(getBundleOrigin).mockReturnValue(null);

    expect(getConnectionInfo()).toEqual({
      protocolVersion: PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
      useWss: false,
    });
  });
});
