const mockGetMaterialColors = jest.fn((options: any) => ({
  primary: options?.scheme === 'dark' ? '#000000FF' : '#FFFFFFFF',
}));

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({
    isDynamicColorAvailable: true,
    getMaterialColors: mockGetMaterialColors,
  })),
}));

function loadColors() {
  jest.resetModules();
  mockGetMaterialColors.mockClear();
  return require('../colors') as typeof import('../colors');
}

describe('getMaterialColors', () => {
  it('calls the native module once for repeated calls with the same scheme and seed color', () => {
    const { getMaterialColors } = loadColors();

    const first = getMaterialColors({ scheme: 'light', seedColor: '#5e6ad2' });
    const second = getMaterialColors({ scheme: 'light', seedColor: '#5e6ad2' });

    expect(mockGetMaterialColors).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('calls the native module again for a different scheme or seed color', () => {
    const { getMaterialColors } = loadColors();

    getMaterialColors({ scheme: 'light', seedColor: '#5e6ad2' });
    getMaterialColors({ scheme: 'dark', seedColor: '#5e6ad2' });
    getMaterialColors({ scheme: 'light', seedColor: '#d25e6a' });

    expect(mockGetMaterialColors).toHaveBeenCalledTimes(3);
  });

  it('calls the native module on every call when no seed color is given', () => {
    const { getMaterialColors } = loadColors();

    getMaterialColors({ scheme: 'light' });
    getMaterialColors({ scheme: 'light' });
    getMaterialColors();
    getMaterialColors();

    expect(mockGetMaterialColors).toHaveBeenCalledTimes(4);
  });

  it('calls the native module on every call when the scheme is not explicit', () => {
    const { getMaterialColors } = loadColors();

    getMaterialColors({ seedColor: '#5e6ad2' });
    getMaterialColors({ seedColor: '#5e6ad2' });

    expect(mockGetMaterialColors).toHaveBeenCalledTimes(2);
  });
});
