import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { Text } from 'react-native';

import { LinkZoomTransitionAlignmentRectDetector } from '../../preview/native';
import { LinkAppleZoomTarget } from '../link-apple-zoom-target';
import { ZoomTransitionTargetContext } from '../zoom-transition-context';

jest.mock('../../preview/native', () => ({
  LinkZoomTransitionAlignmentRectDetector: jest.fn(({ children }) => {
    const { View } = require('react-native');
    return <View testID="alignment-rect-detector">{children}</View>;
  }),
}));

const MockedDetector = LinkZoomTransitionAlignmentRectDetector as jest.Mock;

function makeContextValue(identifier: string | null = 'source-123') {
  return {
    identifier,
    dismissalBoundsRect: null,
    setDismissalBoundsRect: jest.fn(),
    addEnabler: jest.fn(),
    removeEnabler: jest.fn(),
    hasEnabler: false,
  };
}

describe('LinkAppleZoomTarget', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('warns when multiple children are passed and renders null', () => {
    // Pass multiple children directly (not wrapped in a fragment)
    // so Children.count sees > 1
    render(
      <ZoomTransitionTargetContext value={makeContextValue()}>
        <LinkAppleZoomTarget>
          <Text>First</Text>
          <Text>Second</Text>
        </LinkAppleZoomTarget>
      </ZoomTransitionTargetContext>
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Link.AppleZoomTarget only accepts a single child component')
    );
    // Component returns null when multiple children are passed
    expect(screen.queryByText('First')).toBeNull();
    expect(screen.queryByText('Second')).toBeNull();
  });

  it('does not warn with a single child and passes identifier to detector', () => {
    render(
      <ZoomTransitionTargetContext value={makeContextValue()}>
        <LinkAppleZoomTarget>
          <Text testID="child">Single child</Text>
        </LinkAppleZoomTarget>
      </ZoomTransitionTargetContext>
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    const detectorProps = MockedDetector.mock.calls[0][0];
    expect(detectorProps.identifier).toBe('source-123');
    expect(screen.getByTestId('alignment-rect-detector')).toBeTruthy();
  });

  it('renders children directly when context has no identifier', () => {
    render(
      <ZoomTransitionTargetContext value={makeContextValue(null)}>
        <LinkAppleZoomTarget>
          <Text testID="direct-child">Direct child</Text>
        </LinkAppleZoomTarget>
      </ZoomTransitionTargetContext>
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(MockedDetector).not.toHaveBeenCalled();
    expect(screen.getByTestId('direct-child')).toBeTruthy();
  });
});
