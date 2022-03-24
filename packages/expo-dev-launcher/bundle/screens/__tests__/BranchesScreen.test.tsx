import { queryClient } from '../../providers/QueryProvider';
import { Update } from '../../queries/useUpdatesForBranch';
import { render, waitFor, act, fireEvent, mockGraphQLResponse } from '../../test-utils';
import { BranchesScreen, getIncompatibleBranchMessage } from '../BranchesScreen';

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

describe('<BranchesScreen />', () => {
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
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { queryByText, getByText } = render(<BranchesScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByText(/recently updated/i));
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
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { queryByText, getByText } = render(<BranchesScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByText(/recently updated/i));
      expect(queryByText(/Test update/i)).not.toBe(null);
      expect(mockNavigation.navigate).not.toHaveBeenCalledTimes(1);

      fireEvent.press(queryByText(/Test update/i));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Updates', { branchName: 'testBranch' });
    });
  });

  test('renders incompatible branch message', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    const testUpdate: Update = {
      id: '1',
      message: 'Test update',
      runtimeVersion: '1',
      createdAt: new Date().toISOString(),
    };

    mockBranchResponse({
      branchName: 'testBranch',
      compatibleUpdates: [],
      updates: [testUpdate],
    });

    const { getByText } = render(<BranchesScreen navigation={mockNavigation} />);
    const incompatibleMessage = getIncompatibleBranchMessage(1);

    await act(async () => {
      await waitFor(() => getByText(incompatibleMessage));
    });
  });

  test('eas updates empty state', async () => {
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

    const { getByText, queryByText } = render(<BranchesScreen navigation={mockNavigation} />);

    await act(async () => {
      expect(queryByText(/no published branches yet/i)).toBe(null);
      await waitFor(() => getByText(/no published branches yet/i));
    });
  });

  test.todo('eas updates shows error toast');
});
