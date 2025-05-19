import { render } from '@testing-library/react-native';
import * as React from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
import { isEdgeToEdge } from 'react-native-is-edge-to-edge';

import { mockAppearance } from './Helpers';
import { StatusBar as NativeStatusBarWrapper } from '../NativeStatusBarWrapper';
import { StatusBar as ExpoStatusBarAndroid } from '../StatusBar.android';

jest.mock('react-native-is-edge-to-edge', () => ({
  isEdgeToEdge: jest.fn(),
}));

describe('StatusBar', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when edge-to-edge is enabled', () => {
    beforeEach(() => {
      (isEdgeToEdge as jest.Mock).mockReturnValue(true);
    });

    it('passes the prop through to SystemBars if edge-to-edge is enabled', () => {
      mockAppearance('dark', () => {
        expect(render(<ExpoStatusBarAndroid style="auto" />).toJSON()).toEqual(
          render(<SystemBars style={{ statusBar: 'auto', navigationBar: undefined }} />).toJSON()
        );
        jest.runAllTimers();
      });
    });
  });

  describe('when edge-to-edge is disabled', () => {
    beforeEach(() => {
      (isEdgeToEdge as jest.Mock).mockReturnValue(false);
    });

    it('passes the prop through to NativeStatusBarWrapper if edge-to-edge is disabled', () => {
      mockAppearance('dark', () => {
        expect(render(<ExpoStatusBarAndroid style="auto" />).toJSON()).toEqual(
          render(<NativeStatusBarWrapper style="auto" />).toJSON()
        );
        jest.runAllTimers();
      });
    });
  });
});
