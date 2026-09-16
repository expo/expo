import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Toolbar } from '..';

const mockNativeView = jest.fn();

jest.mock('expo', () => ({
  requireNativeModule: jest.fn(() => ({})),
  requireNativeView: jest.fn((_moduleName, viewName) => {
    const { createElement } = require('react');
    const { View } = require('react-native');
    return (props: Record<string, unknown>) => {
      mockNativeView(viewName, props);
      return createElement(View, props);
    };
  }),
}));

it('renders placed items and forwards modifiers', () => {
  const modifiers = [{ $type: 'navigationTitle', title: 'Title' }];

  render(
    <Toolbar modifiers={modifiers}>
      <Text>Content</Text>
      <Toolbar.Content>
        <Toolbar.Item placement="topBarLeading">
          <Text>Back</Text>
        </Toolbar.Item>
      </Toolbar.Content>
    </Toolbar>
  );

  const toolbarProps = mockNativeView.mock.calls.find(([name]) => name === 'ToolbarView')?.[1];
  const itemProps = mockNativeView.mock.calls.find(
    ([name, props]) => name === 'SlotView' && props.name === 'item'
  )?.[1];

  expect(toolbarProps).toMatchObject({ modifiers });
  expect(itemProps).toMatchObject({ name: 'item', extraProps: { placement: 'topBarLeading' } });
});
