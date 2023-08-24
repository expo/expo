import { getUserStatePath } from '@expo/config/build/getUserState';
import { fs, vol } from 'memfs';
import nock from 'nock';

import {
  DevelopmentCodeSigningInfoFile,
  getDevelopmentCodeSigningDirectory,
} from '../../../utils/codesigning';
import { getExpoApiBaseUrl } from '../../endpoint';
import UserSettings from '../UserSettings';
import { getSessionUsingBrowserAuthFlowAsync } from '../expoSsoLauncher';
import {
  Actor,
  getActorDisplayName,
  getUserAsync,
  loginAsync,
  logoutAsync,
  ssoLoginAsync,
} from '../user';

jest.mock('../expoSsoLauncher', () => ({
  getSessionUsingBrowserAuthFlowAsync: jest.fn(),
}));

jest.mock('../../../log');
jest.unmock('../UserSettings');
jest.mock('../../graphql/client', () => ({
  graphqlClient: {
    query: () => {
      return {
        toPromise: () =>
          Promise.resolve({ data: { meUserActor: { id: 'USER_ID', username: 'USERNAME' } } }),
      };
    },
  },
}));
jest.mock('../../graphql/queries/UserQuery', () => ({
  UserQuery: {
    currentUserAsync: async () => ({ __typename: 'User', username: 'USERNAME', id: 'USER_ID' }),
  },
}));

beforeEach(() => {
  vol.reset();
});

const userStub: Actor = {
  __typename: 'User',
  id: 'userId',
  username: 'username',
  accounts: [],
  isExpoAdmin: false,
};

const ssoUserStub: Actor = {
  __typename: 'SSOUser',
  id: 'userId',
  username: 'username',
  accounts: [],
  isExpoAdmin: false,
};

const robotStub: Actor = {
  __typename: 'Robot',
  id: 'userId',
  firstName: 'GLaDOS',
  accounts: [],
  isExpoAdmin: false,
};

function mockLoginRequest() {
  nock(getExpoApiBaseUrl())
    .post('/v2/auth/loginAsync')
    .reply(200, { data: { sessionSecret: 'SESSION_SECRET' } });
}

function resetEnv() {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
    delete process.env.EXPO_TOKEN;
  });
  afterAll(() => {
    delete process.env.EXPO_OFFLINE;
    delete process.env.EXPO_TOKEN;
  });
}

resetEnv();

describe(getUserAsync, () => {
  resetEnv();
  it('skips fetching user without access token or session secret', async () => {
    expect(await getUserAsync()).toBeUndefined();
  });

  it('fetches user when access token is defined', async () => {
    process.env.EXPO_TOKEN = 'accesstoken';
    expect(await getUserAsync()).toMatchObject({ __typename: 'User' });
  });

  it('fetches user when session secret is defined', async () => {
    mockLoginRequest();

    await loginAsync({ username: 'USERNAME', password: 'PASSWORD' });
    expect(await getUserAsync()).toMatchObject({ __typename: 'User' });
  });

  it('skips fetching user when running in offline mode', async () => {
    jest.resetModules();
    process.env.EXPO_OFFLINE = '1';
    const { getUserAsync } = require('../user');

    process.env.EXPO_TOKEN = 'accesstoken';
    await expect(getUserAsync()).resolves.toBeUndefined();
  });
});

describe(loginAsync, () => {
  resetEnv();
  it('saves user data to ~/.expo/state.json', async () => {
    mockLoginRequest();
    await loginAsync({ username: 'USERNAME', password: 'PASSWORD' });

    expect(await fs.promises.readFile(getUserStatePath(), 'utf8')).toMatchInlineSnapshot(`
      "{
        "auth": {
          "sessionSecret": "SESSION_SECRET",
          "userId": "USER_ID",
          "username": "USERNAME",
          "currentConnection": "Username-Password-Authentication"
        }
      }
      "
    `);
  });
});

describe(ssoLoginAsync, () => {
  it('saves user data to ~/.expo/state.json', async () => {
    jest.mocked(getSessionUsingBrowserAuthFlowAsync).mockResolvedValue('SESSION_SECRET');

    await ssoLoginAsync();

    expect(await fs.promises.readFile(getUserStatePath(), 'utf8')).toMatchInlineSnapshot(`
      "{
        "auth": {
          "sessionSecret": "SESSION_SECRET",
          "userId": "USER_ID",
          "username": "USERNAME",
          "currentConnection": "Browser-Flow-Authentication"
        }
      }
      "
    `);
  });
});

describe(logoutAsync, () => {
  resetEnv();
  it('removes the session secret', async () => {
    mockLoginRequest();
    await loginAsync({ username: 'USERNAME', password: 'PASSWORD' });
    expect(UserSettings.getSession()?.sessionSecret).toBe('SESSION_SECRET');

    await logoutAsync();
    expect(UserSettings.getSession()?.sessionSecret).toBeUndefined();
  });

  it('removes code signing data', async () => {
    mockLoginRequest();
    await loginAsync({ username: 'USERNAME', password: 'PASSWORD' });

    await DevelopmentCodeSigningInfoFile.setAsync('test', {});
    expect(fs.existsSync(getDevelopmentCodeSigningDirectory())).toBe(true);

    await logoutAsync();
    expect(fs.existsSync(getDevelopmentCodeSigningDirectory())).toBe(false);
  });
});

describe(getActorDisplayName, () => {
  resetEnv();
  it('returns anonymous for unauthenticated users', () => {
    expect(getActorDisplayName()).toBe('anonymous');
  });

  it('returns username for user actors', () => {
    expect(getActorDisplayName(userStub)).toBe(userStub.username);
  });

  it('returns username for SSO user actors', () => {
    expect(getActorDisplayName(userStub)).toBe(ssoUserStub.username);
  });

  it('returns firstName with robot prefix for robot actors', () => {
    expect(getActorDisplayName(robotStub)).toBe(`${robotStub.firstName} (robot)`);
  });

  it('returns robot prefix only for robot actors without firstName', () => {
    expect(getActorDisplayName({ ...robotStub, firstName: undefined })).toBe('robot');
  });
});
