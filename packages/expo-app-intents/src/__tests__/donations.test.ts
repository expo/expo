import ExpoAppIntents from '../ExpoAppIntentsModule';
import * as AppIntents from '../index';

jest.mock('../ExpoAppIntentsModule', () => ({
  __esModule: true,
  default: { donateIntentAsync: jest.fn(), deleteDonationsAsync: jest.fn() },
}));

const nativeModule = jest.mocked(ExpoAppIntents!);

describe('donations when App Intents are available', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the name and params, and resolves with the donation id', async () => {
    nativeModule.donateIntentAsync.mockResolvedValue('donation-id');
    const params = { dishId: 'margherita', quantity: 2, extras: ['basil'], note: null };

    await expect(AppIntents.donateIntentAsync('orderFood', params)).resolves.toBe('donation-id');
    expect(nativeModule.donateIntentAsync).toHaveBeenCalledTimes(1);
    expect(nativeModule.donateIntentAsync.mock.calls[0]).toEqual(['orderFood', params]);
  });

  it('forwards no params when none are given', async () => {
    nativeModule.donateIntentAsync.mockResolvedValue('donation-id');

    await AppIntents.donateIntentAsync('increaseCounter');

    expect(nativeModule.donateIntentAsync.mock.calls[0][0]).toBe('increaseCounter');
    expect(nativeModule.donateIntentAsync.mock.calls[0][1]).toBeUndefined();
  });

  it.each([
    { ids: ['first-id', 'second-id'] },
    { intent: 'increaseCounter' },
    { entity: 'mailDraft', id: 'draft-1' },
  ])('forwards the filter %j unchanged and resolves with the deleted ids', async (filter) => {
    nativeModule.deleteDonationsAsync.mockResolvedValue(['first-id']);

    await expect(AppIntents.deleteDonationsAsync(filter)).resolves.toEqual(['first-id']);
    expect(nativeModule.deleteDonationsAsync).toHaveBeenCalledTimes(1);
    expect(nativeModule.deleteDonationsAsync.mock.calls[0]).toEqual([filter]);
  });

  it('passes native rejections through', async () => {
    nativeModule.donateIntentAsync.mockRejectedValue(new Error('not registered'));

    await expect(AppIntents.donateIntentAsync('unknown')).rejects.toThrow('not registered');
  });
});
