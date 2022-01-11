import * as React from 'react';

import { getUserProfileAsync, UserAccount, UserData } from '../../functions/getUserProfileAsync';
import { startAuthSessionAsync } from '../../functions/startAuthSessionAsync';
import { setSessionAsync } from '../../native-modules/DevMenuInternal';
import { render, act, fireEvent, waitFor } from '../../test-utils';
import { UserProfileScreen } from '../UserProfileScreen';

jest.mock('../../functions/startAuthSessionAsync');
jest.mock('../../functions/getUserProfileAsync');

const mockStartAuthSession = startAuthSessionAsync as jest.Mock;
const mockGetUserProfileAsync = getUserProfileAsync as jest.Mock;
const mockSetSessionAsync = setSessionAsync as jest.Mock;

const mockNavigation = {
  goBack: jest.fn(),
};

const fakeAccounts: UserAccount[] = [
  {
    id: '1',
    name: 'fake1',
    owner: {
      username: 'username1',
      profilePhoto: '123',
    },
  },
  {
    id: '2',
    name: 'fake2',
    owner: {
      username: 'username2',
      profilePhoto: '123',
    },
  },
];

const fakeUserProfile: UserData = {
  id: '123',
  appCount: 10,
  username: 'fakeUsername',
  profilePhoto: '123',
  email: 'hello@joe.ca',
  accounts: fakeAccounts,
};

const fakeSessionSecret = '123';

describe('<UserProfileScreen />', () => {
  afterEach(() => {
    mockStartAuthSession.mockClear();
    mockGetUserProfileAsync.mockClear();
    mockNavigation.goBack.mockClear();
    mockSetSessionAsync.mockClear();
  });

  test('login button starts oauth session and fetches user profile', async () => {
    const sessionSecret = '321';
    const { getByA11yLabel, getByText } = renderProfileScreen({ sessionSecret });

    expect(startAuthSessionAsync).not.toHaveBeenCalled();
    expect(getUserProfileAsync).not.toHaveBeenCalled();

    await act(async () => {
      const loginButton = getByA11yLabel(/log in/i);

      expect(() => getByText(fakeAccounts[0].owner.username)).toThrow();

      fireEvent.press(loginButton);

      expect(startAuthSessionAsync).toHaveBeenCalledTimes(1);
      expect(startAuthSessionAsync).toHaveBeenCalledWith('login');
      expect(getUserProfileAsync).toHaveBeenCalledTimes(0);
      expect(setSessionAsync).toHaveBeenCalledTimes(0);

      await waitFor(() => getByText(fakeAccounts[0].owner.username));

      expect(setSessionAsync).toHaveBeenCalledTimes(1);
      expect(setSessionAsync).toHaveBeenCalledWith({ sessionSecret });
      expect(getUserProfileAsync).toHaveBeenCalledTimes(1);
    });
  });

  test('signup button starts oauth session and fetches user profile', async () => {
    const { getByA11yLabel, getByText } = renderProfileScreen();

    expect(startAuthSessionAsync).not.toHaveBeenCalled();
    expect(getUserProfileAsync).not.toHaveBeenCalled();

    await act(async () => {
      const signupButton = getByA11yLabel(/sign up/i);

      expect(() => getByText(fakeAccounts[0].owner.username)).toThrow();

      fireEvent.press(signupButton);

      expect(startAuthSessionAsync).toHaveBeenCalledTimes(1);
      expect(startAuthSessionAsync).toHaveBeenCalledWith('signup');
      expect(getUserProfileAsync).toHaveBeenCalledTimes(0);
      expect(setSessionAsync).toHaveBeenCalledTimes(0);

      await waitFor(() => getByText(fakeAccounts[0].owner.username));
      expect(setSessionAsync).toHaveBeenCalledTimes(1);
      expect(setSessionAsync).toHaveBeenCalledWith({ sessionSecret: fakeSessionSecret });
      expect(getUserProfileAsync).toHaveBeenCalledTimes(1);
    });
  });

  test('back button navigates to previous screen', async () => {
    const { getByA11yLabel } = renderProfileScreen();

    expect(mockNavigation.goBack).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(getByA11yLabel(/go back/i));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });

  test('displays multiple accounts', async () => {
    const { getByA11yLabel, getByText } = renderProfileScreen();

    fakeAccounts.forEach((account) => {
      expect(() => getByText(account.owner.username)).toThrow();
    });

    await act(async () => {
      const loginButton = getByA11yLabel(/log in/i);
      fireEvent.press(loginButton);

      await waitFor(() => getByText(fakeAccounts[0].owner.username));

      fakeAccounts.forEach((account) => {
        getByText(account.owner.username);
      });
    });
  });

  test('pressing an account changes the selected account', async () => {
    const { getByA11yLabel, getByText, getByTestId } = renderProfileScreen();

    const loginButton = getByA11yLabel(/log in/i);

    await act(async () => {
      fireEvent.press(loginButton);
      await waitFor(() => getByTestId(`active-account-checkmark-${fakeAccounts[0].id}`));

      expect(() => getByTestId(`active-account-checkmark-${fakeAccounts[1].id}`)).toThrow();

      fireEvent.press(getByText(fakeAccounts[1].owner.username));
      await waitFor(() => getByTestId(`active-account-checkmark-${fakeAccounts[1].id}`));
      expect(() => getByTestId(`active-account-checkmark-${fakeAccounts[0].id}`)).toThrow();
    });
  });

  test('logout', async () => {
    const { getByA11yLabel, getByText } = renderProfileScreen();

    await act(async () => {
      const loginButton = getByA11yLabel(/log in/i);
      fireEvent.press(loginButton);

      const logoutButton = await waitFor(() => getByText(/log out/i));

      mockSetSessionAsync.mockClear();
      fireEvent.press(logoutButton);

      await waitFor(() => getByText(/are you sure you want to log out/i));
      const button = getByA11yLabel(/log out/i);

      fireEvent.press(button);
      expect(setSessionAsync).toHaveBeenCalledTimes(1);
      expect(setSessionAsync).toHaveBeenLastCalledWith(null);
    });
  });

  test.todo('failed login / signup response');
});

type RenderProfileScreenOptions = {
  userProfile?: UserData;
  sessionSecret?: string;
};

function renderProfileScreen(options: RenderProfileScreenOptions = {}) {
  const { userProfile = fakeUserProfile, sessionSecret = fakeSessionSecret } = options;
  mockStartAuthSession.mockResolvedValue(sessionSecret);
  mockGetUserProfileAsync.mockResolvedValue(userProfile);

  const fns = render(<UserProfileScreen navigation={mockNavigation} />);

  return {
    ...fns,
  };
}
