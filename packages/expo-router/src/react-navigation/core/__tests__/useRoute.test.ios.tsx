import { render } from '@testing-library/react-native';

import { Screen } from '../Screen';
import type { RouteProp } from '../types';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useRoute } from '../useRoute';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

test('gets route prop from context', () => {
  expect.assertions(1);

  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const Test = () => {
    const route = useRoute<RouteProp<{ foo: { x: number } }, 'foo'>>();

    expect(route.params.x).toBe(1);

    return null;
  };

  render(
    <BaseNavigationContainer initialState={{ routes: [{ name: 'foo', params: { x: 1 } }] }}>
      <TestNavigator>
        <Screen name="foo" component={Test} />
      </TestNavigator>
    </BaseNavigationContainer>
  );
});
