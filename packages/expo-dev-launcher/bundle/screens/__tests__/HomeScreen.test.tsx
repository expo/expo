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
    const { findByText } = renderHomeScreen({ initialDevSessions: [] });

    expect(await findByText(devSessionInstructionsRegex)).not.toBeNull();
  });

  test('displays refetch button', async () => {
    const { findByText } = renderHomeScreen();

    expect(await findByText(refetchDevSessionsRegex)).not.toBeNull();
  });

  test('fetching local DevSessions on mount', async () => {
    mockGetDevSessionsAsync.mockResolvedValue(fakeDevSessions);

    const { findByText, queryByText } = renderHomeScreen({
      initialDevSessions: [],
    });

    expect(queryByText(fakeLocalDevSession.description)).toBe(null);

    await findByText(fakeLocalDevSession.description);
    await findByText(fakeLocalDevSession2.description);
  });

  test('refetching local DevSessions on button press', async () => {
    const { findByText, queryByText, refetch } = renderHomeScreen({
      initialDevSessions: [],
    });

    mockGetDevSessionsAsync.mockClear();
    mockGetDevSessionsResponse([fakeDevSessions[0]]);
    expect(queryByText(fakeDevSessions[0].description)).toBe(null);
    expect(getDevSessionsAsync).not.toHaveBeenCalled();

    await refetch();

    await findByText(fetchingDevSessionsRegex);
    expect(getDevSessionsAsync).toHaveBeenCalled();

    await findByText(fakeDevSessions[0].description);
  });

  test('refetching enabled after polling is completed', async () => {
    const testPollAmount = 8;

    const { findByText } = renderHomeScreen({
      pollInterval: 1,
      pollAmount: testPollAmount,
      initialDevSessions: [],
    });

    const regexButton = await findByText(refetchDevSessionsRegex);
    expect(getDevSessionsAsync).toHaveBeenCalledTimes(testPollAmount);

    await act(async () => {
      fireEvent.press(regexButton);
    });

    // ensure button is disabled when fetching
    await act(async () => {
      fireEvent.press(await findByText(fetchingDevSessionsRegex));
    });

    await findByText(refetchDevSessionsRegex);
    expect(getDevSessionsAsync).toHaveBeenCalledTimes(testPollAmount * 2);
  });

  // TODO - Fix toggle button fireEvent
  test.skip('select dev session by entered url', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderHomeScreen();

    await act(async () => {
      expect(() => getByPlaceholderText(textInputPlaceholder)).toThrow();
      const toggleButton = getByText(textInputToggleRegex);
      fireEvent.press(toggleButton);

      const input = await waitFor(() => getByPlaceholderText(textInputPlaceholder));
      expect(loadApp).toHaveBeenCalledTimes(0);

      fireEvent.changeText(input, 'exp://tester');
      const loadButton = getByTestId('DevLauncherLoadAppButton');
      await waitFor(() => expect(loadButton).not.toBeDisabled());
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
    const { getByLabelText } = renderHomeScreen();
    expect(fakeNavigation.navigate).not.toHaveBeenCalled();

    const button = getByLabelText(/to user profile/i);

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
      pollAmount: 1,
      initialDevSessions: [],
      initialUserData: {
        username: 'hi',
        id: '1234',
        appCount: 1,
        profilePhoto: '123',
        isExpoAdmin: true,
        accounts: [
          {
            id: '1',
            name: 'Joe',
            ownerUserActor: { username: '123', fullName: 'Joe', profilePhoto: '' },
          },
        ],
      },
    });

    expect(queryByText(fakeDevSession.description)).toBe(null);
    expect(queryByText(fakeDevSession2.description)).toBe(null);

    await waitFor(() => getByText(fakeDevSession.description));
    getByText(fakeDevSession2.description);
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

    await waitFor(() => getByText(fakeApp.url));
    expect(getRecentlyOpenedApps).toHaveBeenCalled();
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
    pollInterval = 0,
    pollAmount = 5,
    ...props
  } = options;

  const { getByText, ...fns } = render(
    <HomeScreen
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
    await waitFor(() => getByText(refetchDevSessionsRegex), { timeout: 1000 });
    fireEvent.press(getByText(refetchDevSessionsRegex));
  }

  return {
    ...fns,
    getByText,
    refetch,
  };
}
