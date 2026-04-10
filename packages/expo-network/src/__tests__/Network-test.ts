import { NetworkStateType } from '../Network.types';
import { addNetworkStateListener } from '../Network';

describe('addNetworkStateListener', () => {
  it('notifies listener when network state changes to disconnected', () => {
    const ExpoNetwork = require('../ExpoNetwork').default;
    const mockListener = jest.fn();

    addNetworkStateListener(mockListener);

    // Simulate the native module emitting a disconnect event.
    // After the fix, onLost correctly emits NONE/false/false when the lost
    // network matches the active network (stale activeNetwork scenario).
    const disconnectEvent = {
      type: NetworkStateType.NONE,
      isConnected: false,
      isInternetReachable: false,
    };
    ExpoNetwork.emit('onNetworkStateChanged', disconnectEvent);

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(disconnectEvent);
  });

  it('notifies listener when network state changes to connected', () => {
    const ExpoNetwork = require('../ExpoNetwork').default;
    const mockListener = jest.fn();

    addNetworkStateListener(mockListener);

    const connectEvent = {
      type: NetworkStateType.WIFI,
      isConnected: true,
      isInternetReachable: true,
    };
    ExpoNetwork.emit('onNetworkStateChanged', connectEvent);

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith(connectEvent);
  });

  it('stops notifying after subscription is removed', () => {
    const ExpoNetwork = require('../ExpoNetwork').default;
    const mockListener = jest.fn();

    const subscription = addNetworkStateListener(mockListener);
    subscription.remove();

    ExpoNetwork.emit('onNetworkStateChanged', {
      type: NetworkStateType.NONE,
      isConnected: false,
      isInternetReachable: false,
    });

    expect(mockListener).not.toHaveBeenCalled();
  });

  it('handles rapid connect/disconnect transitions', () => {
    const ExpoNetwork = require('../ExpoNetwork').default;
    const mockListener = jest.fn();

    addNetworkStateListener(mockListener);

    // Simulate rapid toggling — the fix ensures each event carries the
    // correct state rather than a stale "connected" on disconnect.
    const events = [
      { type: NetworkStateType.NONE, isConnected: false, isInternetReachable: false },
      { type: NetworkStateType.WIFI, isConnected: true, isInternetReachable: true },
      { type: NetworkStateType.NONE, isConnected: false, isInternetReachable: false },
    ];

    events.forEach((event) => ExpoNetwork.emit('onNetworkStateChanged', event));

    expect(mockListener).toHaveBeenCalledTimes(3);
    expect(mockListener.mock.calls[0][0]).toEqual(events[0]);
    expect(mockListener.mock.calls[1][0]).toEqual(events[1]);
    expect(mockListener.mock.calls[2][0]).toEqual(events[2]);
  });
});
