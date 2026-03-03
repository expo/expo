import { render } from '@testing-library/react-native';

import { StackToolbarButton } from '../toolbar/StackToolbarButton';
import { ToolbarPlacementContext } from '../toolbar/context';
import { StackToolbarIcon } from '../toolbar/toolbar-primitives';

const mockUseMaterialIconSource = jest.fn(
  () => undefined as import('react-native').ImageSourcePropType | undefined
);

jest.mock('../../../utils/materialIcon', () => ({
  useMaterialIconSource: (...args: Parameters<typeof mockUseMaterialIconSource>) =>
    mockUseMaterialIconSource(...args),
}));

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
  mockUseMaterialIconSource.mockReturnValue(undefined);
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

describe('StackToolbarButton md icon support on Android', () => {
  it('extracts md icon name from Icon child and passes as mdIconName', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton>
          <StackToolbarIcon md="search" />
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    expect(mockUseMaterialIconSource).toHaveBeenCalledWith('search');
    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'search',
      }),
      undefined
    );
  });

  it('md prop on Button directly works', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton md="star" />
      </ToolbarPlacementContext.Provider>
    );

    expect(mockUseMaterialIconSource).toHaveBeenCalledWith('star');
    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'star',
      }),
      undefined
    );
  });

  it('Icon child md takes priority over Button md prop', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton md="star">
          <StackToolbarIcon md="search" />
        </StackToolbarButton>
      </ToolbarPlacementContext.Provider>
    );

    // Child "search" should take priority over prop "star"
    expect(mockUseMaterialIconSource).toHaveBeenCalledWith('search');
    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        mdIconName: 'search',
      }),
      undefined
    );
  });

  it('explicit src takes priority over resolved md source', () => {
    const explicitSource = { uri: 'https://example.com/explicit.png' };
    const materialSource = { uri: 'resolved-material-icon' };
    mockUseMaterialIconSource.mockReturnValue(materialSource);

    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton md="search" icon={explicitSource} />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: explicitSource,
      }),
      undefined
    );
  });

  it('uses resolved material source when no explicit source', () => {
    const materialSource = { uri: 'resolved-material-icon' };
    mockUseMaterialIconSource.mockReturnValue(materialSource);

    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton md="search" />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        source: materialSource,
      }),
      undefined
    );
  });

  it('md + sf combination passes both systemImageName and mdIconName', () => {
    render(
      <ToolbarPlacementContext.Provider value="bottom">
        <StackToolbarButton icon="magnifyingglass" md="search" />
      </ToolbarPlacementContext.Provider>
    );

    expect(MockedRouterToolbarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        systemImageName: 'magnifyingglass',
        mdIconName: 'search',
      }),
      undefined
    );
  });
});
