import * as React from 'react';

import { Packager } from '../../../functions/getLocalPackagersAsync';
import {
  getPendingDeepLink,
  addDeepLinkListener,
} from '../../../native-modules/DevLauncherInternal';
import { render, act, waitFor, fireEvent } from '../../../test-utils';
import { PendingDeepLinkPrompt } from '../PendingDeepLinkPrompt';

const mockGetPendingDeepLink = getPendingDeepLink as jest.Mock;
const mockAddDeepLinkListener = addDeepLinkListener as jest.Mock;

const fakeLocalPackager: Packager = {
  url: 'hello',
  description: 'fakePackagerDescription',
  hideImage: false,
  source: 'test',
};

describe('<PendingDeepLinkPrompt />', () => {
  afterEach(() => {
    mockGetPendingDeepLink.mockClear();
    mockAddDeepLinkListener.mockClear();
  });

  test('retrieves pending deep link on mount and displays in modal', async () => {
    const fakeDeepLink = 'testing-testing-123';
    mockGetPendingDeepLink.mockResolvedValueOnce(fakeDeepLink);

    expect(getPendingDeepLink).not.toHaveBeenCalled();

    const { getByText, queryByText } = render(<PendingDeepLinkPrompt />);

    expect(queryByText(fakeDeepLink)).toBe(null);

    await act(async () => {
      expect(getPendingDeepLink).toHaveBeenCalled();
      await waitFor(() => getByText(/deep link received/i));
      await waitFor(() => getByText(fakeDeepLink));
    });
  });

  test('shows and hides modal', async () => {
    const fakeDeepLink = 'testing-testing-123';
    mockGetPendingDeepLink.mockResolvedValueOnce(fakeDeepLink);

    const { getByText, queryByText } = render(<PendingDeepLinkPrompt />);

    expect(queryByText(fakeDeepLink)).toBe(null);
    expect(queryByText(/open somewhere else/i)).toBe(null);

    await act(async () => {
      const closeButton = await waitFor(() => getByText(/open somewhere else/i));
      fireEvent.press(closeButton);
      await waitFor(() => expect(queryByText(/open somewhere else/i)).toBe(null));
    });
  });

  test('shows packagers in modal', async () => {
    const fakeDeepLink = 'testing-testing-123';
    mockGetPendingDeepLink.mockResolvedValueOnce(fakeDeepLink);

    const { getByText } = render(<PendingDeepLinkPrompt />, {
      initialAppProviderProps: { initialPackagers: [fakeLocalPackager] },
    });

    await act(async () => {
      await waitFor(() => getByText(/deep link received/i));
      getByText(fakeLocalPackager.description);
    });
  });

  test('calls subscription on mount', async () => {
    expect(addDeepLinkListener).not.toHaveBeenCalled();

    render(<PendingDeepLinkPrompt />);

    await act(async () => {
      expect(addDeepLinkListener).toHaveBeenCalled();
    });
  });
});
