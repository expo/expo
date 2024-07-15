import { getCompatibleBranchMessage } from '../../components/EmptyBranchesMessage';
import { queryClient } from '../../providers/QueryProvider';
import { Branch } from '../../queries/useBranchesForApp';
import { Update } from '../../queries/useUpdatesForBranch';
import { render, waitFor, act, fireEvent, mockGraphQLResponse } from '../../test-utils';
import { BranchesScreen, getIncompatibleBranchMessage } from '../BranchesScreen';

jest.mock('graphql-request', () => {
  return {
    GraphQLClient() {
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

// TODO(lukmccall): fixme
describe.skip('<BranchesScreen />', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  test('render', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Test update',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
      manifestPermalink: '123',
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { queryByText, getByText } = renderBranchesScreen(mockNavigation);

    await act(async () => {
      await waitFor(() => getByText(/testBranch/i), { timeout: 5000 });
      expect(queryByText(/testBranch/i)).not.toBe(null);
      expect(queryByText(/test update/i)).not.toBe(null);
    });
  });

  test('eas update row press', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Test update',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
      manifestPermalink: '123',
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { queryByText, getByText } = renderBranchesScreen(mockNavigation);

    await act(async () => {
      await waitFor(() => getByText(/test update/i));
      expect(queryByText(/Test update/i)).not.toBe(null);
      expect(mockNavigation.navigate).not.toHaveBeenCalledTimes(1);

      fireEvent.press(queryByText(/Test update/i));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Updates', { branchName: 'testBranch' });
    });
  });

  test('renders incompatible branch message in footer', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Test update',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
      manifestPermalink: '123',
    };

    const compatibleBranch: Branch = {
      id: '1',
      name: 'testBranch',
      updates: [testUpdate],
    };

    const incompatibleBranch: Branch = {
      id: '2',
      name: 'Incompatible branch',
      updates: [{ ...testUpdate, id: '2' }],
    };

    mockGraphQLResponse({
      app: {
        byId: {
          updateBranches: [
            { ...compatibleBranch, compatibleUpdates: [testUpdate] },
            { ...incompatibleBranch, compatibleUpdates: [] },
          ],
        },
      },
    });

    const { getByText } = renderBranchesScreen(mockNavigation);
    const incompatibleMessage = getIncompatibleBranchMessage(1);

    await act(async () => {
      await waitFor(() => getByText(incompatibleMessage));
    });
  });

  test('empty branches state', async () => {
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

    const { getByText, queryByText } = renderBranchesScreen(mockNavigation);

    await act(async () => {
      expect(queryByText(/no published updates yet/i)).toBe(null);
      await waitFor(() => getByText(/no published updates yet/i));
    });
  });

  test('no compatible branches state', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const incompatibleBranch: Branch = {
      id: '2',
      name: 'Incompatible branch',
      updates: [
        {
          id: '1',
          createdAt: '123',
          message: '321',
          runtimeVersion: '123',
          manifestPermalink: '123',
        },
      ],
    };

    mockGraphQLResponse({
      app: {
        byId: {
          updateBranches: [{ ...incompatibleBranch, compatibleUpdates: [] }],
        },
      },
    });

    const { findByText, queryByText } = renderBranchesScreen(mockNavigation);

    expect(queryByText(getCompatibleBranchMessage(1))).toBe(null);
    await findByText(getCompatibleBranchMessage(1));
  });

  test.todo('recent empty branches are visible in the footer');
  test.todo('eas updates shows error toast');
});

function renderBranchesScreen(mockNavigation: any) {
  return render(<BranchesScreen navigation={mockNavigation} />, {
    initialAppProviderProps: {
      initialUserData: {
        id: '123',
        appCount: 10,
        username: 'fakeUsername',
        profilePhoto: '123',
        isExpoAdmin: true,
        accounts: [],
      },
    },
  });
}
