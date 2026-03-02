import { render } from '@testing-library/react-native';

import { StackToolbarButton } from '../toolbar/StackToolbarButton';
import { ToolbarPlacementContext } from '../toolbar/context';
import { StackToolbarIcon } from '../toolbar/toolbar-primitives';

jest.mock('../../../toolbar/native', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  return {
    RouterToolbarHost: jest.fn(({ children }) => (
      <View testID="RouterToolbarHost">{children}</View>
    )),
    RouterToolbarItem: jest.fn((props) => <View testID="RouterToolbarItem" {...props} />),
  };
});

const { RouterToolbarItem } = jest.requireMock(
  '../../../toolbar/native'
) as typeof import('../../../toolbar/native');
const MockedRouterToolbarItem = RouterToolbarItem as jest.MockedFunction<typeof RouterToolbarItem>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StackToolbarButton source extraction on Android', () => {
  it('extracts source from ImageSourcePropType icon prop', () => {
    const imageSource = { uri: 'https://example.com/icon.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon={imageSource} />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: imageSource,
      }),
      undefined
    );
  });

  it('extracts source from Stack.Toolbar.Icon src child', () => {
    const imageSource = { uri: 'https://example.com/icon-from-child.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton>
          <StackToolbarIcon src={imageSource} />
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: imageSource,
      }),
      undefined
    );
  });

  it('source is undefined when icon is SF Symbol string', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon="star.fill" />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: undefined,
      }),
      undefined
    );
  });

  it('source is undefined when icon is xcasset', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton>
          <StackToolbarIcon xcasset="custom-icon" />
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: undefined,
      }),
      undefined
    );
  });

  it('Icon src child takes priority over icon prop for source', () => {
    const iconPropSource = { uri: 'https://example.com/from-prop.png' };
    const childSource = { uri: 'https://example.com/from-child.png' };
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon={iconPropSource}>
          <StackToolbarIcon src={childSource} />
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: childSource,
      }),
      undefined
    );
  });
});
