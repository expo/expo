import * as React from 'react';

import { getLocalPackagersAsync, Packager } from '../../functions/getLocalPackagersAsync';
import { loadApp } from '../../native-modules/DevLauncherInternal';
import { render, waitFor, fireEvent, act } from '../../test-utils';
import { HomeScreen, HomeScreenProps } from '../HomeScreen';

jest.mock('../../functions/getLocalPackagersAsync');
jest.mock('../../hooks/useDebounce');

const mockGetLocalPackagersAsync = getLocalPackagersAsync as jest.Mock;

function mockGetPackagersResponse(response: Packager[]) {
  return mockGetLocalPackagersAsync.mockResolvedValueOnce(response);
}

const packagerInstructionsRegex = /start a local development server with/i;
const fetchingPackagersRegex = /searching for local servers/i;
const refetchPackagersRegex = /refetch local servers/i;
const textInputToggleRegex = /enter url manually/i;

describe('<HomeScreen />', () => {
  afterEach(() => {
    const mockLoadApp = loadApp as jest.Mock;
    mockLoadApp.mockReset();
  });

  test('displays instructions on starting packager when none are found', async () => {
    const { getByText } = await renderHomeScreen({ initialPackagers: [], fetchOnMount: false });
    await waitFor(() => getByText(packagerInstructionsRegex));
  });

  test('displays refetch button', async () => {
    const { getByText } = await renderHomeScreen();
    await waitFor(() => getByText(refetchPackagersRegex));
  });

  test('fetching local packagers on mount', async () => {
    mockGetPackagersResponse(fakePackagers);

    expect(() => getByText(fakeLocalPackager.description)).toThrow();

    const { getByText } = await renderHomeScreen({ fetchOnMount: true });

    await waitFor(() => getByText(fakeLocalPackager.description));
    await waitFor(() => getByText(fakeLocalPackager2.description));
  });

  test('refetching local packagers on button press', async () => {
    const { getByText, refetch } = await renderHomeScreen({
      fetchOnMount: false,
      initialPackagers: [],
    });

    mockGetLocalPackagersAsync.mockClear();
    mockGetPackagersResponse([fakePackagers[0]]);
    expect(() => getByText(fakePackagers[0].description)).toThrow();
    expect(getLocalPackagersAsync).not.toHaveBeenCalled();

    await refetch();
    expect(getByText(fetchingPackagersRegex));
    expect(getLocalPackagersAsync).toHaveBeenCalled();

    await waitFor(() => getByText(fakePackagers[0].description));
  });

  test('refetching enabled after polling is completed', async () => {
    const testPollAmount = 8;

    const { getByText } = await renderHomeScreen({
      fetchOnMount: false,
      pollInterval: 1,
      pollAmount: testPollAmount,
      initialPackagers: [],
    });

    mockGetLocalPackagersAsync.mockClear();

    await act(async () => {
      await waitFor(() => getByText(refetchPackagersRegex));
      fireEvent.press(getByText(refetchPackagersRegex));
      expect(getLocalPackagersAsync).toHaveBeenCalledTimes(1);
    });

    // ensure button is disabled when fetching
    await act(async () => {
      fireEvent.press(getByText(fetchingPackagersRegex));
      await waitFor(() => getByText(refetchPackagersRegex));
      expect(getLocalPackagersAsync).toHaveBeenCalledTimes(testPollAmount);
      fireEvent.press(getByText(refetchPackagersRegex));
      expect(getLocalPackagersAsync).toHaveBeenCalledTimes(testPollAmount + 1);
    });
  });

  test('select packager by entered url', async () => {
    const { getByText, getByPlaceholderText } = await renderHomeScreen();

    expect(() => getByPlaceholderText(/exp:\/\/192/i)).toThrow();
    const toggleButton = getByText(textInputToggleRegex);
    fireEvent.press(toggleButton);

    const input = await waitFor(() => getByPlaceholderText(/exp:\/\/192/i));
    expect(loadApp).toHaveBeenCalledTimes(0);

    fireEvent.changeText(input, 'exp://tester');
    fireEvent.press(getByText(/connect/i));

    expect(loadApp).toHaveBeenCalledTimes(1);
    expect(loadApp).toHaveBeenCalledWith('exp://tester');
  });

  test('unable to enter an invalid url', async () => {
    const { getByText, getByPlaceholderText } = await renderHomeScreen();

    expect(() => getByPlaceholderText(/exp:\/\/192/i)).toThrow();
    const toggleButton = getByText(textInputToggleRegex);
    fireEvent.press(toggleButton);

    const input = await waitFor(() => getByPlaceholderText(/exp:\/\/192/i));
    expect(loadApp).not.toHaveBeenCalled();

    fireEvent.changeText(input, 'i am invalid');
    fireEvent.press(getByText(/connect/i));

    expect(loadApp).not.toHaveBeenCalled();
    await waitFor(() => getByText(/invalid url/i));
  });

  test.todo('display for a valid url that is not found?');

  test('select packager from packager list', async () => {
    const fakeLocalPackager: Packager = {
      url: 'hello',
      description: 'fakePackagerDescription',
      hideImage: false,
      source: 'test',
    };

    mockGetPackagersResponse([fakeLocalPackager]);

    const { getByText } = await renderHomeScreen();

    await waitFor(() => getByText(fakeLocalPackager.description));

    fireEvent.press(getByText(fakeLocalPackager.description));
    expect(loadApp).toHaveBeenCalled();
    expect(loadApp).toHaveBeenCalledWith(fakeLocalPackager.url);
  });
});

const fakeLocalPackager: Packager = {
  url: 'hello',
  description: 'fakePackagerDescription',
  hideImage: false,
  source: 'test',
};

const fakeLocalPackager2: Packager = {
  url: 'hello',
  description: 'fakePackagerDescription2',
  hideImage: false,
  source: 'test',
};

const fakePackagers = [fakeLocalPackager, fakeLocalPackager2];

type RenderHomeScreenOptions = HomeScreenProps & {
  initialPackagers?: Packager[];
};

async function renderHomeScreen(options: RenderHomeScreenOptions = {}) {
  const {
    initialPackagers = fakePackagers,
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
      {...props}
    />,
    {
      initialAppProviderProps: {
        initialPackagers,
      },
    }
  );

  async function refetch() {
    await waitFor(() => getByText(refetchPackagersRegex));
    await act(async () => fireEvent.press(getByText(refetchPackagersRegex)));
  }

  return {
    ...fns,
    getByText,
    refetch,
  };
}
