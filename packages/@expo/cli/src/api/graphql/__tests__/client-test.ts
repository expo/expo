import { fetch } from '../../../utils/fetch';
import { graphql, query, mutate } from '../client';

jest.mock('../../../utils/fetch', () => ({
  ...jest.requireActual('../../../utils/fetch'),
  fetch: jest.fn(),
}));
jest.mock('../../user/UserSettings', () => ({
  getAccessToken: jest.fn(() => 'token'),
  getSession: jest.fn(() => null),
}));

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

type Data = { value: number };

const Document = graphql<Data>(`
  mutation Example {
    value
  }
`);

function mockJsonResponseOnce(data: unknown) {
  asMock(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ data }),
  } as any);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('mutate', () => {
  it('hits the network on every call and never serves a cached result', async () => {
    mockJsonResponseOnce({ value: 1 });
    mockJsonResponseOnce({ value: 2 });

    // Even with identical documents and variables, a mutation must re-run rather than return the
    // previous result from the in-memory cache.
    expect(await mutate(Document, {})).toEqual({ value: 1 });
    expect(await mutate(Document, {})).toEqual({ value: 2 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('issues a POST to the GraphQL endpoint', async () => {
    mockJsonResponseOnce({ value: 1 });
    await mutate(Document, {});
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/graphql'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('query', () => {
  it('serves repeated identical queries from the in-memory cache', async () => {
    mockJsonResponseOnce({ value: 7 });
    // Queued but should never be requested, since the second call is a cache hit.
    mockJsonResponseOnce({ value: 999 });
    expect(await query(Document, {})).toEqual({ value: 7 });
    expect(await query(Document, {})).toEqual({ value: 7 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
