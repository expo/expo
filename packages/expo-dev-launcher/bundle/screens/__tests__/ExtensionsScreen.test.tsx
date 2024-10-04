import { getCompatibleBranchMessage } from '../../components/EmptyBranchesMessage';
import { UserData } from '../../functions/getUserProfileAsync';
import * as DevLauncher from '../../native-modules/DevLauncherInternal';
import { queryClient } from '../../providers/QueryProvider';
import { Update } from '../../queries/useUpdatesForBranch';
import { render, waitFor, act, fireEvent, mockGraphQLResponse } from '../../test-utils';
import { ExtensionsScreen } from '../ExtensionsScreen';

jest.mock('../../native-modules/DevLauncherInternal', () => {
  const originalMock = jest.requireActual('../../native-modules/__mocks__/DevLauncherInternal');
  return {
    ...originalMock,
    updatesConfig: {
      appId: '123',
      runtimeVersion: '123',
      sdkVersion: '1',
      usesEASUpdates: true,
    },
  };
});

jest.mock('graphql-request', () => {
  return {
    GraphQLClient(apiUrl: string) {
      return {
        request: jest.fn(),
      };
    },
    gql: jest.fn(),
  };
});

function mockBranchResponse({
  branchName,
  updates,
  compatibleUpdates,
}: {
  branchName: string;
  updates: Update[];
  compatibleUpdates: Update[];
}) {
  mockGraphQLResponse({
    app: {
      byId: {
        updateBranches: [
          {
            id: '1',
            name: branchName,
            compatibleUpdates,
            updates,
          },
        ],
      },
    },
  });
}

describe('<ExtensionsScreen />', () => {
  beforeEach(() => {
    queryClient.clear();
    DevLauncher.updatesConfig.usesEASUpdates = true;
  });

  test('render', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    render(<ExtensionsScreen navigation={mockNavigation} />);
    // necessary to avoid react update outside of act() warning
    await act(async () => {});
  });

  test('no extensions are not installed', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    DevLauncher.updatesConfig.usesEASUpdates = false;

    const { getByText, getAllByText } = render(<ExtensionsScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByText(/extensions allow you to customize your development build/i));
      await waitFor(() => getAllByText(/learn more/i));
    });
  });

  test('unauthenticated user', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    mockGraphQLResponse({
      app: {
        byId: {
          updateBranches: [],
        },
      },
    });

    const { getByA11yLabel } = render(<ExtensionsScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByA11yLabel(/log in/i));
      await waitFor(() => getByA11yLabel(/sign up/i));
    });
  });

  test('eas update row press', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Hello joe',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
      manifestPermalink: '123',
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { getByText } = renderAuthenticatedScreen({ mockNavigation });

    await act(async () => {
      await waitFor(() => getByText(/branch: testBranch/i));
      await waitFor(() => getByText(/Update "Hello joe"/i));
      expect(mockNavigation.navigate).not.toHaveBeenCalledTimes(1);

      fireEvent.press(getByText(/hello joe/i));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Updates', { branchName: 'testBranch' });
    });
  });

  test('eas updates see all branches press', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Hello joe',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
      manifestPermalink: '123',
    };

    mockGraphQLResponse({
      app: {
        byId: {
          updateBranches: [
            {
              id: '1',
              name: 'testBranch1',
              compatibleUpdates: [testUpdate],
              updates: [testUpdate],
            },
            {
              id: '2',
              name: 'testBranch2',
              compatibleUpdates: [testUpdate],
              updates: [testUpdate],
            },
          ],
        },
      },
    });


    const { getByText } = renderAuthenticatedScreen({ mockNavigation });

    await act(async () => {
      await waitFor(() => getByText(/see all branches/i));

      fireEvent.press(getByText(/all branches/i));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Branches');
    });
  });

  test('eas updates no compatible branches state', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [
        {
          id: '1',
          message: '123',
          createdAt: '123',
          runtimeVersion: '123',
          manifestPermalink: '123',
        },
      ],
      compatibleUpdates: [],
    });

    const { getByText } = renderAuthenticatedScreen({ mockNavigation });

    await act(async () => {
      await waitFor(() => getByText(getCompatibleBranchMessage(1)));
    });
  });

  test('eas updates no branches state', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    mockGraphQLResponse({
      app: {
        byId: {
          updateBranches: [],
        },
      },
    });

    const { getByText } = renderAuthenticatedScreen({ mockNavigation });

    await act(async () => {
      await waitFor(() => getByText(/no published updates yet/i));
    });
  });

  test.todo('eas updates shows error toast');
});

function renderAuthenticatedScreen({ mockNavigation }) {
  const fakeUserProfile: UserData = {
    id: '123',
    appCount: 10,
    username: 'fakeUsername',
    profilePhoto: '123',
    email: 'hello@joe.ca',
    accounts: [],
    isExpoAdmin: true,
  };

  return render(<ExtensionsScreen navigation={mockNavigation} />, {
    initialAppProviderProps: { initialUserData: fakeUserProfile },
  });
}
