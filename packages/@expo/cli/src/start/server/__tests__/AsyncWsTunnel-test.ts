import { getConfig } from '@expo/config';
import * as tunnel from '@expo/ws-tunnel';

import { TunnelMutation } from '../../../api/graphql/mutations/TunnelMutation';
import { AppQuery } from '../../../api/graphql/queries/AppQuery';
import { hasCredentials } from '../../../api/user/UserSettings';
import { getUserAsync } from '../../../api/user/user';
import { AsyncWsTunnel, getExpoAccountTunnelUrlAsync } from '../AsyncWsTunnel';

jest.mock('@expo/config');
jest.mock('@expo/ws-tunnel');
jest.mock('../../../api/graphql/queries/AppQuery');
jest.mock('../../../api/graphql/mutations/TunnelMutation');
jest.mock('../../../api/user/user');
jest.mock('../../../api/user/UserSettings', () => ({
  ...jest.requireActual('../../../api/user/UserSettings'),
  hasCredentials: jest.fn(() => false),
}));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

function mockConfig(extra?: Record<string, any>) {
  asMock(getConfig).mockReturnValue({ exp: { extra } } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
  asMock(hasCredentials).mockReturnValue(false);
  asMock(TunnelMutation.createSignedTunnelUrlAsync).mockResolvedValue({
    label: 'c-acme-abc123-xyz',
    url: 'https://c-acme-abc123-xyz.on.expo.app/_tunnel/connect?token=jwt',
  });
});

describe('getExpoAccountTunnelUrlAsync', () => {
  it('mints a signed URL for the EAS project owning account', async () => {
    mockConfig({ eas: { projectId: 'project-id' } });
    asMock(AppQuery.byIdAsync).mockResolvedValue({
      id: 'project-id',
      scopeKey: 'scope',
      ownerAccount: { id: 'owner-account-id', name: 'acme' },
    });

    const url = await getExpoAccountTunnelUrlAsync('/');

    expect(AppQuery.byIdAsync).toHaveBeenCalledWith('project-id');
    expect(TunnelMutation.createSignedTunnelUrlAsync).toHaveBeenCalledWith('owner-account-id');
    expect(url).toBe('https://c-acme-abc123-xyz.on.expo.app/_tunnel/connect?token=jwt');
  });

  it('falls back to the actor primary account when there is no EAS project ID', async () => {
    mockConfig(undefined);
    asMock(getUserAsync).mockResolvedValue({
      __typename: 'User',
      id: 'user-id',
      username: 'acme',
      primaryAccount: { id: 'primary-account-id' },
      accounts: [],
    });

    const url = await getExpoAccountTunnelUrlAsync('/');

    expect(AppQuery.byIdAsync).not.toHaveBeenCalled();
    expect(TunnelMutation.createSignedTunnelUrlAsync).toHaveBeenCalledWith('primary-account-id');
    expect(url).toBe('https://c-acme-abc123-xyz.on.expo.app/_tunnel/connect?token=jwt');
  });

  it('returns null when logged out', async () => {
    mockConfig(undefined);
    asMock(getUserAsync).mockResolvedValue(undefined);

    expect(await getExpoAccountTunnelUrlAsync('/')).toBeNull();
    expect(TunnelMutation.createSignedTunnelUrlAsync).not.toHaveBeenCalled();
  });

  it('returns null when the mutation fails', async () => {
    mockConfig({ eas: { projectId: 'project-id' } });
    asMock(AppQuery.byIdAsync).mockResolvedValue({
      id: 'project-id',
      scopeKey: 'scope',
      ownerAccount: { id: 'owner-account-id', name: 'acme' },
    });
    asMock(TunnelMutation.createSignedTunnelUrlAsync).mockRejectedValue(new Error('rate limited'));

    expect(await getExpoAccountTunnelUrlAsync('/')).toBeNull();
  });
});

describe('startAsync (signed)', () => {
  it('throws a CommandError prompting login when logged out', async () => {
    asMock(hasCredentials).mockReturnValue(false);
    mockConfig(undefined);
    asMock(getUserAsync).mockResolvedValue(undefined);

    const wsTunnel = new AsyncWsTunnel('/', 8081, { useExpoAccount: true });
    const error = await wsTunnel.startAsync().then(
      () => null,
      (e) => e
    );
    expect(error.message).toMatch(/Couldn't create a signed tunnel URL for this project/);
    expect(error.message).toMatch(/npx expo login/);
  });

  it('omits the login hint when the user is already logged in', async () => {
    asMock(hasCredentials).mockReturnValue(true);
    mockConfig(undefined);
    asMock(getUserAsync).mockResolvedValue({
      __typename: 'User',
      id: 'user-id',
      username: 'acme',
      primaryAccount: { id: 'primary-account-id' },
      accounts: [],
    });
    asMock(TunnelMutation.createSignedTunnelUrlAsync).mockRejectedValue(new Error('no access'));

    const wsTunnel = new AsyncWsTunnel('/', 8081, { useExpoAccount: true });
    const error = await wsTunnel.startAsync().then(
      () => null,
      (e) => e
    );
    expect(error.message).toMatch(/may not have access/);
    expect(error.message).not.toMatch(/expo login/);
  });

  it('tunnels the signed URL to the dev server on any port', async () => {
    mockConfig({ eas: { projectId: 'project-id' } });
    asMock(AppQuery.byIdAsync).mockResolvedValue({
      id: 'project-id',
      scopeKey: 'scope',
      ownerAccount: { id: 'owner-account-id', name: 'acme' },
    });
    asMock(tunnel.startAsync).mockResolvedValue(new URL('https://c-acme.on.expo.app/'));

    const wsTunnel = new AsyncWsTunnel('/', 3000, { useExpoAccount: true });
    await wsTunnel.startAsync();

    expect(tunnel.startAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        apiUrl: 'https://c-acme-abc123-xyz.on.expo.app/_tunnel/connect?token=jwt',
        targetUrl: 'http://localhost:3000',
      })
    );
    expect(wsTunnel.getActiveUrl()).toBe('https://c-acme.on.expo.app/');
  });
});

describe('startAsync (legacy)', () => {
  it('only supports tunneling a dev server on port 8081', async () => {
    const wsTunnel = new AsyncWsTunnel('/', 3000);
    await expect(wsTunnel.startAsync()).rejects.toThrow(/only supports tunneling over port 8081/);
    expect(tunnel.startAsync).not.toHaveBeenCalled();
  });

  it('connects to the default service with a session on port 8081', async () => {
    asMock(tunnel.startAsync).mockResolvedValue(new URL('https://exp.ws-tunnel.dev/'));

    const wsTunnel = new AsyncWsTunnel('/', 8081);
    await wsTunnel.startAsync();

    expect(tunnel.startAsync).toHaveBeenCalledWith(
      expect.objectContaining({ session: expect.any(String) })
    );
  });
});
