import { UIManager } from 'react-native';
import { Metrics } from '../SafeArea.types';

describe('InitialWindow', () => {
  describe('initialWindowMetrics', () => {
    it('is null when no view config is available', () => {
      jest.resetModules();
      expect(require('../InitialWindow').initialWindowMetrics).toBe(null);
    });

    it('it uses the constant provided by the view config', () => {
      jest.resetModules();
      const testMetrics: Metrics = {
        insets: {
          top: 20,
          left: 0,
          right: 0,
          bottom: 0,
        },
        frame: {
          x: 0,
          y: 0,
          height: 100,
          width: 100,
        },
      };
      UIManager.getViewManagerConfig = jest.fn((name) => {
        if (name === 'RNCSafeAreaProvider') {
          return {
            Commands: {},
            Constants: {
              initialWindowMetrics: testMetrics,
            },
          };
        }
        return { Commands: {} };
      });

      expect(require('../InitialWindow').initialWindowMetrics).toBe(
        testMetrics,
      );
      expect(UIManager.getViewManagerConfig).toBeCalledWith(
        'RNCSafeAreaProvider',
      );
    });
  });
});
