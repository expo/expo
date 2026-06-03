import { render } from '@testing-library/react-native';
import type { ComponentType, ReactElement } from 'react';
import { View } from 'react-native';

import { mockNativeViewRender } from './expoUIMock';

type AutoHostTestComponents = {
  Button: ComponentType<{ label: string }>;
  Host: ComponentType<{ children?: React.ReactNode }>;
  RNHostView: ComponentType<{ children: ReactElement; matchContents?: boolean }>;
  nativeComponentCases: AutoHostTestCase[];
  hostOwningComponentCases?: AutoHostTestCase[];
};

export type AutoHostTestCase = {
  name: string;
  render: () => ReactElement;
};

function getHostViewRenderCount(): number {
  return mockNativeViewRender.mock.calls.filter(([call]) => call.viewName === 'HostView').length;
}

export function describeAutoHostBehavior({
  Button,
  Host,
  RNHostView,
  nativeComponentCases,
  hostOwningComponentCases = [],
}: AutoHostTestComponents) {
  beforeEach(() => {
    mockNativeViewRender.mockClear();
  });

  describe('universal auto host', () => {
    it.each(nativeComponentCases)(
      'wraps $name rendered outside Host in one implicit Host',
      ({ render: renderCase }) => {
        render(renderCase());

        expect(getHostViewRenderCount()).toBe(1);
      }
    );

    it.each(nativeComponentCases)(
      'does not add an implicit Host for $name when already inside an explicit Host',
      ({ render: renderCase }) => {
        render(<Host>{renderCase()}</Host>);

        expect(getHostViewRenderCount()).toBe(1);
      }
    );

    it('does not add an implicit Host for RNHostView when already inside an explicit Host', () => {
      render(
        <Host>
          <RNHostView matchContents>
            <View />
          </RNHostView>
        </Host>
      );

      expect(getHostViewRenderCount()).toBe(1);
    });

    it.each(hostOwningComponentCases)(
      'does not add an implicit Host inside host-owning $name',
      ({ render: renderCase }) => {
        render(renderCase());

        expect(getHostViewRenderCount()).toBe(1);
      }
    );

    it('adds a new implicit Host for universal content inside an RNHostView subtree', () => {
      render(
        <Host>
          <RNHostView matchContents>
            <Button label="Press me" />
          </RNHostView>
        </Host>
      );

      expect(getHostViewRenderCount()).toBe(2);
    });

    it('adds a new implicit Host for universal content inside nested RNHostView subtrees', () => {
      render(
        <Host>
          <RNHostView matchContents>
            <Host>
              <RNHostView matchContents>
                <Button label="Press me" />
              </RNHostView>
            </Host>
          </RNHostView>
        </Host>
      );

      expect(getHostViewRenderCount()).toBe(3);
    });
  });
}
