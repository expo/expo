import { render } from '@testing-library/react-native';

import type { NativeStackDescriptorMap } from '../../../fork/native-stack/descriptors-context';
import { DescriptorsContext } from '../../../fork/native-stack/descriptors-context';
import {
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
} from '../../../navigationParams';
import { useIsPreview } from '../../preview/PreviewRouteContext';
import { LinkZoomTransitionEnabler } from '../../preview/native';
import { ZoomTransitionEnabler } from '../ZoomTransitionEnabler.ios';
import { ZoomTransitionTargetContext } from '../zoom-transition-context';

jest.mock('../../preview/PreviewRouteContext');
jest.mock('../../preview/native', () => ({
  LinkZoomTransitionEnabler: jest.fn(() => null),
}));

const MockedLinkZoomTransitionEnabler = LinkZoomTransitionEnabler as jest.Mock;
const mockUseIsPreview = useIsPreview as jest.Mock;

function makeRoute(key: string) {
  return {
    key,
    name: 'test',
    params: {
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: 'source-123',
      [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: key,
    },
  };
}

function makeDescriptors(
  routeKey: string,
  options: { gestureEnabled?: boolean } = {}
): NativeStackDescriptorMap {
  return {
    [routeKey]: { options } as any,
  };
}

/** Renders ZoomTransitionEnabler wrapped with required contexts */
function renderEnabler({
  routeKey = 'route-1',
  descriptors,
  dismissalBoundsRect = null,
}: {
  routeKey?: string;
  descriptors?: NativeStackDescriptorMap;
  dismissalBoundsRect?: any;
}) {
  const route = makeRoute(routeKey);
  return render(
    <DescriptorsContext value={descriptors ?? {}}>
      <ZoomTransitionTargetContext
        value={{ identifier: null, dismissalBoundsRect, setDismissalBoundsRect: undefined }}>
        <ZoomTransitionEnabler route={route} />
      </ZoomTransitionTargetContext>
    </DescriptorsContext>
  );
}

describe('ZoomTransitionEnabler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsPreview.mockReturnValue(false);
  });

  it('passes { maxX: 0, maxY: 0 } when gestureEnabled is false and no hook-set rect', () => {
    const routeKey = 'route-1';
    renderEnabler({
      routeKey,
      descriptors: makeDescriptors(routeKey, { gestureEnabled: false }),
    });

    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalledTimes(1);
    const props = MockedLinkZoomTransitionEnabler.mock.calls[0][0];
    expect(props.dismissalBoundsRect).toEqual({ maxX: 0, maxY: 0 });
    expect(props.zoomTransitionSourceIdentifier).toBe('source-123');
  });

  it('passes null when gestureEnabled is true', () => {
    const routeKey = 'route-1';
    renderEnabler({
      routeKey,
      descriptors: makeDescriptors(routeKey, { gestureEnabled: true }),
    });

    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalledTimes(1);
    const props = MockedLinkZoomTransitionEnabler.mock.calls[0][0];
    expect(props.dismissalBoundsRect).toBeNull();
  });

  it('passes null when gestureEnabled is undefined', () => {
    const routeKey = 'route-1';
    renderEnabler({
      routeKey,
      descriptors: makeDescriptors(routeKey),
    });

    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalledTimes(1);
    const props = MockedLinkZoomTransitionEnabler.mock.calls[0][0];
    expect(props.dismissalBoundsRect).toBeNull();
  });

  it('hook-set rect takes priority over gestureEnabled: false', () => {
    const routeKey = 'route-1';
    const customRect = { minX: 10, maxX: 200, minY: 20, maxY: 400 };
    renderEnabler({
      routeKey,
      descriptors: makeDescriptors(routeKey, { gestureEnabled: false }),
      dismissalBoundsRect: customRect,
    });

    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalledTimes(1);
    const props = MockedLinkZoomTransitionEnabler.mock.calls[0][0];
    expect(props.dismissalBoundsRect).toEqual(customRect);
  });

  it('passes null when no descriptor exists for route key', () => {
    const routeKey = 'route-1';
    renderEnabler({
      routeKey,
      descriptors: {}, // no descriptor for route-1
    });

    expect(MockedLinkZoomTransitionEnabler).toHaveBeenCalledTimes(1);
    const props = MockedLinkZoomTransitionEnabler.mock.calls[0][0];
    expect(props.dismissalBoundsRect).toBeNull();
  });
});
