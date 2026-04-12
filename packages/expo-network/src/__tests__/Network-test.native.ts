import { act, renderHook, waitFor } from '@testing-library/react-native';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoNetwork from '../ExpoNetwork';
import {
  INVALID_SIGNAL_STRENGTH,
  NetworkStateType,
  addCellSignalStrengthListener,
  addWifiSignalStrengthListener,
  getCellSignalStrengthAsync,
  getWifiSignalStrengthAsync,
  useActiveSignalStrength,
  useCellSignalStrength,
  useWifiSignalStrength,
} from '../Network';

afterEach(() => {
  unmockAllProperties();
});

/* ----- getCellSignalStrengthAsync ----- */

describe('getCellSignalStrengthAsync', () => {
  it('returns the value from the native module', async () => {
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(3));
    expect(await getCellSignalStrengthAsync()).toBe(3);
  });
});

/* ----- getWifiSignalStrengthAsync ----- */

describe('getWifiSignalStrengthAsync', () => {
  it('returns the value from the native module', async () => {
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(4));
    expect(await getWifiSignalStrengthAsync()).toBe(4);
  });
});

/* ----- addCellSignalStrengthListener ----- */

describe('addCellSignalStrengthListener', () => {
  it('receives emitted cell signal strength events', () => {
    const listener = jest.fn();
    const subscription = addCellSignalStrengthListener(listener);

    ExpoNetwork.emit('onCellSignalStrengthChanged', { strength: 2 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ strength: 2 });

    subscription.remove();
  });
});

/* ----- addWifiSignalStrengthListener ----- */

describe('addWifiSignalStrengthListener', () => {
  it('receives emitted Wi-Fi signal strength events', () => {
    const listener = jest.fn();
    const subscription = addWifiSignalStrengthListener(listener);

    ExpoNetwork.emit('onWifiSignalStrengthChanged', { strength: 4 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ strength: 4 });

    subscription.remove();
  });
});

/* ----- useCellSignalStrength ----- */

describe('useCellSignalStrength', () => {
  it('returns the initial value from the native module', async () => {
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(2));

    const { result } = renderHook(() => useCellSignalStrength());

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
  });

  it('updates when a cell signal strength event is emitted', async () => {
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(1));

    const { result } = renderHook(() => useCellSignalStrength());

    await waitFor(() => {
      expect(result.current).toBe(1);
    });

    act(() => {
      ExpoNetwork.emit('onCellSignalStrengthChanged', { strength: 4 });
    });

    expect(result.current).toBe(4);
  });

  it('cleans up the listener on unmount', async () => {
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(0));

    const { result, unmount } = renderHook(() => useCellSignalStrength());

    await waitFor(() => {
      expect(result.current).toBe(0);
    });

    unmount();

    act(() => {
      ExpoNetwork.emit('onCellSignalStrengthChanged', { strength: 3 });
    });

    expect(result.current).toBe(0);
  });
});

/* ----- useWifiSignalStrength ----- */

describe('useWifiSignalStrength', () => {
  it('returns the initial value from the native module', async () => {
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(3));

    const { result } = renderHook(() => useWifiSignalStrength());

    await waitFor(() => {
      expect(result.current).toBe(3);
    });
  });

  it('updates when a Wi-Fi signal strength event is emitted', async () => {
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(2));

    const { result } = renderHook(() => useWifiSignalStrength());

    await waitFor(() => {
      expect(result.current).toBe(2);
    });

    act(() => {
      ExpoNetwork.emit('onWifiSignalStrengthChanged', { strength: 4 });
    });

    expect(result.current).toBe(4);
  });
});

/* ----- useActiveSignalStrength ----- */

describe('useActiveSignalStrength', () => {
  it('subscribes to cell signal strength when network type is CELLULAR', async () => {
    mockProperty(
      ExpoNetwork,
      'getNetworkStateAsync',
      jest.fn().mockResolvedValue({ type: NetworkStateType.CELLULAR })
    );
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(2));

    const { result } = renderHook(() => useActiveSignalStrength());
    await act(async () => {});

    await waitFor(() => {
      expect(result.current).toBe(2);
    });

    act(() => {
      ExpoNetwork.emit('onCellSignalStrengthChanged', { strength: 4 });
    });

    expect(result.current).toBe(4);
  });

  it('subscribes to Wi-Fi signal strength when network type is WIFI', async () => {
    mockProperty(
      ExpoNetwork,
      'getNetworkStateAsync',
      jest.fn().mockResolvedValue({ type: NetworkStateType.WIFI })
    );
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(3));

    const { result } = renderHook(() => useActiveSignalStrength());
    await act(async () => {});

    await waitFor(() => {
      expect(result.current).toBe(3);
    });

    act(() => {
      ExpoNetwork.emit('onWifiSignalStrengthChanged', { strength: 1 });
    });

    expect(result.current).toBe(1);
  });

  it('switches subscriptions when network type changes from CELLULAR to WIFI', async () => {
    mockProperty(
      ExpoNetwork,
      'getNetworkStateAsync',
      jest.fn().mockResolvedValue({ type: NetworkStateType.CELLULAR })
    );
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(2));
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(4));

    const { result } = renderHook(() => useActiveSignalStrength());
    await act(async () => {});

    await waitFor(() => {
      expect(result.current).toBe(2);
    });

    act(() => {
      ExpoNetwork.emit('onNetworkStateChanged', {
        type: NetworkStateType.WIFI,
        isConnected: true,
        isInternetReachable: true,
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(4);
    });

    act(() => {
      ExpoNetwork.emit('onWifiSignalStrengthChanged', { strength: 1 });
    });

    expect(result.current).toBe(1);
  });

  it('unsubscribes from the old network type when switching', async () => {
    mockProperty(
      ExpoNetwork,
      'getNetworkStateAsync',
      jest.fn().mockResolvedValue({ type: NetworkStateType.CELLULAR })
    );
    mockProperty(ExpoNetwork, 'getCellSignalStrengthAsync', jest.fn().mockResolvedValue(2));
    mockProperty(ExpoNetwork, 'getWifiSignalStrengthAsync', jest.fn().mockResolvedValue(4));

    const { result } = renderHook(() => useActiveSignalStrength());
    await act(async () => {});

    await waitFor(() => {
      expect(result.current).toBe(2);
    });

    act(() => {
      ExpoNetwork.emit('onNetworkStateChanged', {
        type: NetworkStateType.WIFI,
        isConnected: true,
        isInternetReachable: true,
      });
    });

    await waitFor(() => {
      expect(result.current).toBe(4);
    });

    // Cell events should no longer update the strength
    act(() => {
      ExpoNetwork.emit('onCellSignalStrengthChanged', { strength: 0 });
    });

    expect(result.current).toBe(4);
  });

  it('returns INVALID_SIGNAL_STRENGTH for non-wireless network types', async () => {
    mockProperty(
      ExpoNetwork,
      'getNetworkStateAsync',
      jest.fn().mockResolvedValue({ type: NetworkStateType.ETHERNET })
    );

    const { result } = renderHook(() => useActiveSignalStrength());
    await act(async () => {});

    expect(result.current).toBe(INVALID_SIGNAL_STRENGTH);
  });
});
