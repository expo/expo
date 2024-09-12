import * as React from 'react';

import { getUserProfileAsync, UserAccount, UserData } from '../../functions/getUserProfileAsync';
import { startAuthSessionAsync } from '../../functions/startAuthSessionAsync';
import { setSessionAsync } from '../../native-modules/DevLauncherAuth';
import { render, act, fireEvent } from '../../test-utils';
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
    ownerUserActor: {
      username: 'username1',
      profilePhoto: '123',
    },
  },
  {
    id: '2',
    name: 'fake2',
    ownerUserActor: {
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
  accounts: fakeAccounts,
  isExpoAdmin: false,
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
    const { getByLabelText, getByText, findByText } = renderProfileScreen({ sessionSecret });

    expect(startAuthSessionAsync).not.toHaveBeenCalled();
    expect(getUserProfileAsync).not.toHaveBeenCalled();

    const loginButton = getByLabelText(/log in/i);
    expect(() => getByText(fakeAccounts[0].ownerUserActor!.username)).toThrow();

    await act(async () => {
      fireEvent.press(loginButton);
      expect(startAuthSessionAsync).toHaveBeenCalledTimes(1);
      expect(startAuthSessionAsync).toHaveBeenCalledWith('login');
      expect(getUserProfileAsync).toHaveBeenCalledTimes(0);
      expect(setSessionAsync).toHaveBeenCalledTimes(0);
    });

    await findByText(fakeAccounts[0].ownerUserActor!.username);

    expect(setSessionAsync).toHaveBeenCalledTimes(1);
    expect(setSessionAsync).toHaveBeenCalledWith(sessionSecret);
    expect(getUserProfileAsync).toHaveBeenCalledTimes(1);
  });

  test('signup button starts oauth session and fetches user profile', async () => {
    const { findByLabelText, queryByText, findByText } = renderProfileScreen();

    expect(startAuthSessionAsync).not.toHaveBeenCalled();
    expect(getUserProfileAsync).not.toHaveBeenCalled();

    const signupButton = await findByLabelText(/sign up/i);

    await act(async () => {
      expect(queryByText(fakeAccounts[0].ownerUserActor!.username)).toBe(null);

      fireEvent.press(signupButton);

      expect(startAuthSessionAsync).toHaveBeenCalledTimes(1);
      expect(startAuthSessionAsync).toHaveBeenCalledWith('signup');
      expect(getUserProfileAsync).toHaveBeenCalledTimes(0);
      expect(setSessionAsync).toHaveBeenCalledTimes(0);

      await findByText(fakeAccounts[0].ownerUserActor!.username);
      expect(setSessionAsync).toHaveBeenCalledTimes(1);
      expect(setSessionAsync).toHaveBeenCalledWith(fakeSessionSecret);
      expect(getUserProfileAsync).toHaveBeenCalledTimes(1);
    });
  });

  test('back button navigates to previous screen', async () => {
    const { findByLabelText } = renderProfileScreen();

    expect(mockNavigation.goBack).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(await findByLabelText(/go back/i));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });

  test('displays multiple accounts', async () => {
    const { findByLabelText, findByText, queryByText } = renderProfileScreen();

    fakeAccounts.forEach((account) => {
      expect(queryByText(account.ownerUserActor!.username)).toBe(null);
    });

    await act(async () => {
      const loginButton = await findByLabelText(/log in/i);
      fireEvent.press(loginButton);

      await findByText(fakeAccounts[0].ownerUserActor!.username);

      fakeAccounts.forEach(async (account) => {
        await findByText(account.ownerUserActor!.username);
      });
    });
  });

  test('pressing an account changes the selected account', async () => {
    const { findByLabelText, findByText, findByTestId, queryByTestId } = renderProfileScreen();

    const loginButton = await findByLabelText(/log in/i);

    await act(async () => {
      fireEvent.press(loginButton);
    });

    await findByTestId(`active-account-checkmark-${fakeAccounts[0].id}`);
    expect(queryByTestId(`active-account-checkmark-${fakeAccounts[1].id}`)).toBe(null);

    await act(async () => {
      fireEvent.press(await findByText(fakeAccounts[1].ownerUserActor!.username));
    });

    await findByTestId(`active-account-checkmark-${fakeAccounts[1].id}`);
    expect(queryByTestId(`active-account-checkmark-${fakeAccounts[0].id}`)).toBe(null);
  });

  test('logout', async () => {
    const { findByLabelText, findByText } = renderProfileScreen();

    const loginButton = await findByLabelText(/log in/i);

    await act(async () => {
      fireEvent.press(loginButton);
    });

    const logoutButton = await findByText(/log out/i);

    await act(async () => {
      mockSetSessionAsync.mockClear();
      fireEvent.press(logoutButton);
    });

    await findByText(/are you sure you want to log out/i);
    const button = await findByLabelText(/log out/i);

    await act(async () => {
      fireEvent.press(button);
    });

    expect(setSessionAsync).toHaveBeenCalledTimes(1);
    expect(setSessionAsync).toHaveBeenLastCalledWith(null);
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
