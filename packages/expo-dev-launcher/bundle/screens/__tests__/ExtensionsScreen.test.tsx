import { queryClient } from '../../providers/QueryProvider';
import { Update } from '../../queries/useUpdatesForBranch';
import { render, waitFor, act, fireEvent, mockGraphQLResponse } from '../../test-utils';
import { ExtensionsScreen } from '../ExtensionsScreen';

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
  });

  test('render', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    render(<ExtensionsScreen navigation={mockNavigation} />);
    // necessary to avoid react update outside of act() warning
    await act(async () => {});
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
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { getByText } = render(<ExtensionsScreen navigation={mockNavigation} />);

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
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [testUpdate],
      compatibleUpdates: [testUpdate],
    });

    const { getByText } = render(<ExtensionsScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByText(/see all branches/i));

      fireEvent.press(getByText(/all branches/i));

      expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Branches');
    });
  });

  test('eas updates empty state', async () => {
    const mockNavigation: any = {
      navigate: jest.fn(),
    };

    mockBranchResponse({
      branchName: 'testBranch',
      updates: [],
      compatibleUpdates: [],
    });

    const { getByText } = render(<ExtensionsScreen navigation={mockNavigation} />);

    await act(async () => {
      await waitFor(() => getByText(/no published branches yet/i));
    });
  });

  test.todo('no extensions installed state');
  test.todo('eas updates shows error toast');
});
