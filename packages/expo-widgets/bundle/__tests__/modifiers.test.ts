import '../index';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { jsx } from '../jsx-runtime-stub';

jest.mock('@expo/ui/swift-ui', () => ({}));
jest.mock('@expo/ui/swift-ui/modifiers', () => ({}));

function render(tree: unknown): any {
  globalThis.__expoWidgetLayout = () => tree as Record<string, unknown>;
  return globalThis.__expoWidgetRender({}, { timestamp: 1 });
}

describe('widget modifiers', () => {
  afterEach(() => {
    delete globalThis.__expoWidgetLayout;
  });

  it('keeps the fillMaxWidth fraction on the modifier record sent to native', () => {
    const tree = render(
      jsx('RowView', {
        children: [
          jsx('TextView', { text: 'left', modifiers: [fillMaxWidth(0.5)] }),
          jsx('TextView', { text: 'right' }),
        ],
      })
    );

    expect(tree.props.children[0].props.modifiers).toEqual([
      { $type: 'fillMaxWidth', fraction: 0.5 },
    ]);
  });

  it('sends no fraction when fillMaxWidth has no argument', () => {
    const tree = render(jsx('TextView', { text: 'label', modifiers: [fillMaxWidth()] }));

    expect(tree.props.modifiers).toEqual([{ $type: 'fillMaxWidth' }]);
  });
});
