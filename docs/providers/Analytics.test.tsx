import { jest } from '@jest/globals';

let status: 'pending' | 'granted' | 'denied' = 'pending';
let replay: (events: unknown[]) => void = () => {};
const enqueueAnalyticsEvent = jest.fn();
jest.unstable_mockModule('@expo/styleguide-cookie-consent', () => ({
  isAnalyticsConsented: () => status === 'granted',
  getAnalyticsConsentStatus: () => status,
  enqueueAnalyticsEvent,
  setAnalyticsReplayFn: (fn: typeof replay) => {
    replay = fn;
  },
}));

const { reportWebMcpToolCall } = await import('./Analytics');

const params = {
  webmcp_tool_name: 'search_docs',
  webmcp_outcome: 'success',
  webmcp_tool_page: '/get-started/create-a-project/',
} as const;
const gtag = jest.fn();

beforeEach(() => {
  window.gtag = gtag;
});

describe(reportWebMcpToolCall, () => {
  it('sends the event when analytics consent is granted', () => {
    status = 'granted';
    reportWebMcpToolCall(params);
    expect(gtag).toHaveBeenCalledWith('event', 'webmcp_tool_call', params);
    expect(enqueueAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('queues the event while consent is pending, and the replay sends it', () => {
    status = 'pending';
    reportWebMcpToolCall(params);
    expect(gtag).not.toHaveBeenCalled();
    replay(enqueueAnalyticsEvent.mock.calls.map(([event]) => event));
    expect(gtag).toHaveBeenCalledWith('event', 'webmcp_tool_call', params);
  });

  it('sends nothing when analytics consent is denied', () => {
    status = 'denied';
    reportWebMcpToolCall(params);
    expect(gtag).not.toHaveBeenCalled();
    expect(enqueueAnalyticsEvent).not.toHaveBeenCalled();
  });
});
