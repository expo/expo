import * as React from 'react';

import { getDevSessionsAsync } from '../../functions/getDevSessionsAsync';
import { UserData } from '../../functions/getUserProfileAsync';
import { getRecentlyOpenedApps, loadApp } from '../../native-modules/DevLauncherInternal';
import { RecentApp } from '../../providers/RecentlyOpenedAppsProvider';
import { render, waitFor, fireEvent, act } from '../../test-utils';
import { DevSession } from '../../types';
import { HomeScreen, HomeScreenProps } from '../HomeScreen';

jest.mock('../../functions/getDevSessionsAsync');
jest.mock('../../hooks/useDebounce');

const mockGetDevSessionsAsync = getDevSessionsAsync as jest.Mock;
const mockGetRecentlyOpenedApps = getRecentlyOpenedApps as jest.Mock;

const mockFns = [mockGetDevSessionsAsync, mockGetRecentlyOpenedApps];

function mockGetDevSessionsResponse(response: DevSession[]) {
  return mockGetDevSessionsAsync.mockResolvedValueOnce(response);
}

const devSessionInstructionsRegex = /start a local development server with/i;
const fetchingDevSessionsRegex = /searching for development servers/i;
const refetchDevSessionsRegex = /fetch development servers/i;
const textInputToggleRegex = /enter url manually/i;
const textInputPlaceholder = 'http://10.0.0.25:8081';

const mockLoadApp = loadApp as jest.Mock;

describe('<HomeScreen />', () => {
  beforeEach(() => {
    mockFns.forEach((fn) => fn.mockClear());
  });

  afterEach(() => {
    mockLoadApp.mockReset();
    mockLoadApp.mockResolvedValue('');
  });

  test('displays instructions on starting DevSession when none are found', async () => {
    const { getByText } = renderHomeScreen({ initialDevSessions: [], fetchOnMount: false });
    await waitFor(() => getByText(devSessionInstructionsRegex));
  });

  test('displays refetch button', async () => {
    const { getByText } = renderHomeScreen();
    await waitFor(() => getByText(refetchDevSessionsRegex));
  });

  test('fetching local DevSessions on mount', async () => {
    mockGetDevSessionsAsync.mockResolvedValue(fakeDevSessions);

    const { getByText, queryByText } = renderHomeScreen({
      fetchOnMount: true,
      initialDevSessions: [],
    });

    expect(queryByText(fakeLocalDevSession.description)).toBe(null);

    await waitFor(() => getByText(fakeLocalDevSession.description));
    await waitFor(() => getByText(fakeLocalDevSession2.description));
  });

  test('refetching local DevSessions on button press', async () => {
    const { getByText, refetch } = renderHomeScreen({
      fetchOnMount: false,
      initialDevSessions: [],
    });

    mockGetDevSessionsAsync.mockClear();
    mockGetDevSessionsResponse([fakeDevSessions[0]]);
    expect(() => getByText(fakeDevSessions[0].description)).toThrow();
    expect(getDevSessionsAsync).not.toHaveBeenCalled();

    await refetch();
    expect(getByText(fetchingDevSessionsRegex));
    expect(getDevSessionsAsync).toHaveBeenCalled();

    await waitFor(() => getByText(fakeDevSessions[0].description));
  });

  test('refetching enabled after polling is completed', async () => {
    const testPollAmount = 8;

    const { getByText } = renderHomeScreen({
      fetchOnMount: false,
      pollInterval: 1,
      pollAmount: testPollAmount,
      initialDevSessions: [],
    });

    mockGetDevSessionsAsync.mockClear();

    await act(async () => {
      await waitFor(() => getByText(refetchDevSessionsRegex));
      fireEvent.press(getByText(refetchDevSessionsRegex));
      expect(getDevSessionsAsync).toHaveBeenCalledTimes(1);
    });

    // ensure button is disabled when fetching
    await act(async () => {
      fireEvent.press(getByText(fetchingDevSessionsRegex));
      await waitFor(() => getByText(refetchDevSessionsRegex));
      expect(getDevSessionsAsync).toHaveBeenCalledTimes(testPollAmount);
      fireEvent.press(getByText(refetchDevSessionsRegex));
      expect(getDevSessionsAsync).toHaveBeenCalledTimes(testPollAmount + 1);
    });
  });

  test('select dev session by entered url', async () => {
    const { getByText, getByPlaceholderText } = renderHomeScreen();

    await act(async () => {
      expect(() => getByPlaceholderText(textInputPlaceholder)).toThrow();
      const toggleButton = getByText(textInputToggleRegex);
      fireEvent.press(toggleButton);

      const input = await waitFor(() => getByPlaceholderText(textInputPlaceholder));
      expect(loadApp).toHaveBeenCalledTimes(0);

      fireEvent.changeText(input, 'exp://tester');
      fireEvent.press(getByText(/connect/i));

      expect(loadApp).toHaveBeenCalledTimes(1);
      expect(loadApp).toHaveBeenCalledWith('exp://tester');
    });
  });

  // TODO - figure out how to trigger blur event
  test.skip('unable to enter an invalid url', async () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderHomeScreen();

    expect(queryByPlaceholderText(textInputPlaceholder)).toBe(null);
    const toggleButton = getByText(textInputToggleRegex);
    fireEvent.press(toggleButton);

    const input = await waitFor(() => getByPlaceholderText(textInputPlaceholder));
    expect(loadApp).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'i am invalid');
    fireEvent.press(getByText(/connect/i));

    expect(loadApp).not.toHaveBeenCalled();
    await waitFor(() => getByText(/invalid url/i));
  });

  test.todo('display for a valid url that is not found');

  test('select dev session from list', async () => {
    const { getByText } = renderHomeScreen();

    await act(async () => {
      await waitFor(() => getByText(fakeLocalDevSession.description));

      fireEvent.press(getByText(fakeLocalDevSession.description));
      expect(loadApp).toHaveBeenCalled();
      expect(loadApp).toHaveBeenCalledWith(fakeLocalDevSession.url);
    });
  });

  test('navigate to user profile', async () => {
    const { getByA11yLabel } = renderHomeScreen();
    expect(fakeNavigation.navigate).not.toHaveBeenCalled();

    const button = getByA11yLabel(/to user profile/i);

    await act(async () => {
      fireEvent.press(button);
      expect(fakeNavigation.navigate).toHaveBeenCalled();
      expect(fakeNavigation.navigate).toHaveBeenLastCalledWith('User Profile');
    });
  });

  test('displays dev sessions for authenticated users', async () => {
    const fakeDevSession: DevSession = {
      description: 'devSession1',
      source: 'desktop',
      url: 'http://10.0.0.225:12',
    };

    const fakeDevSession2: DevSession = {
      description: 'devSession2',
      source: 'desktop',
      url: 'http://10.0.0.225:134',
    };

    mockGetDevSessionsAsync.mockResolvedValueOnce([fakeDevSession, fakeDevSession2]);

    const { getByText, queryByText } = renderHomeScreen({
      fetchOnMount: true,
      pollAmount: 1,
      initialDevSessions: [],
      initialUserData: {
        username: 'hi',
        id: '1234',
        appCount: 1,
        email: '123@321.ca',
        profilePhoto: '123',
        isExpoAdmin: true,
        accounts: [{ id: '1', name: 'Joe', owner: { username: '123', fullName: 'Joe' } }],
      },
    });

    expect(queryByText(fakeDevSession.description)).toBe(null);
    expect(queryByText(fakeDevSession2.description)).toBe(null);

    await act(async () => {
      await waitFor(() => getByText(fakeDevSession.description));
      getByText(fakeDevSession2.description);
    });
  });

  test('displays recently opened apps', async () => {
    expect(getRecentlyOpenedApps).not.toHaveBeenCalled();
    const fakeApp: RecentApp = {
      id: '123',
      name: 'fakeAppName',
      url: 'fakeAppUrl',
      timestamp: 123,
      isEASUpdate: false,
    };

    mockGetRecentlyOpenedApps.mockResolvedValueOnce([fakeApp]);

    const { queryByText, getByText } = renderHomeScreen();

    expect(queryByText(fakeApp.name)).toBe(null);

    await act(async () => {
      await waitFor(() => getByText(fakeApp.url));
      expect(getRecentlyOpenedApps).toHaveBeenCalled();
    });
  });
});

const fakeLocalDevSession: DevSession = {
  url: 'test://url321',
  description: 'fakeDevSessiondescription1',
  source: 'desktop',
};

const fakeLocalDevSession2: DevSession = {
  url: 'test://url123',
  description: 'fakeDevSessiondescription2',
  source: 'desktop',
};

const fakeDevSessions = [fakeLocalDevSession, fakeLocalDevSession2];

const fakeNavigation = {
  navigate: jest.fn(),
};

type RenderHomeScreenOptions = HomeScreenProps & {
  initialDevSessions?: DevSession[];
  initialUserData?: UserData;
};

function renderHomeScreen(options: RenderHomeScreenOptions = {}) {
  const {
    initialDevSessions = fakeDevSessions,
    initialUserData = undefined,
    fetchOnMount = false,
    pollInterval = 0,
    pollAmount = 5,
    ...props
  } = options;

  const { getByText, ...fns } = render(
    <HomeScreen
      fetchOnMount={fetchOnMount}
      pollAmount={pollAmount}
      pollInterval={pollInterval}
      navigation={fakeNavigation}
      {...props}
    />,
    {
      initialAppProviderProps: {
        initialDevSessions,
        initialUserData,
      },
    }
  );

  async function refetch() {
    await waitFor(() => getByText(refetchDevSessionsRegex));
    await act(async () => fireEvent.press(getByText(refetchDevSessionsRegex)));
  }

  return {
    ...fns,
    getByText,
    refetch,
  };
}
