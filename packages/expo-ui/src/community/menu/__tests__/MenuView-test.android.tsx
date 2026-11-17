import { act, render, screen } from '@testing-library/react-native';

import { MenuView } from '../MenuView.android';
import type { MenuAction } from '../types';

jest.mock('expo', () => jest.requireActual('../../../__mocks__/expo'));

function getPopups() {
  return screen.container.queryAll((node) => node.props.expanded !== undefined);
}

function getItem(title: string) {
  const [item] = screen.container.queryAll(
    (node) =>
      node.props.onItemPressed !== undefined &&
      node.queryAll((child) => child.props.text === title).length > 0
  );
  return item!;
}

// If the group remounted, the submenu would lose its `expanded` state and close.
it.each([
  ['the first group', false],
  ['a group after an inline submenu', true],
])('keeps a submenu open when an action before it in %s hides', async (_, withSection) => {
  const actions = (hideFirst: boolean): MenuAction[] => [
    ...(withSection
      ? [
          {
            id: 'section',
            title: 'Section',
            displayInline: true,
            subactions: [{ title: 'Inside' }],
          },
        ]
      : []),
    { id: 'first', title: 'First', attributes: { hidden: hideFirst } },
    { id: 'submenu', title: 'Submenu', subactions: [{ title: 'Sub action' }] },
  ];

  const { rerender } = await render(<MenuView actions={actions(false)} />);
  await act(() => {
    getItem('Submenu').props.onItemPressed();
  });
  expect(getPopups().at(-1)!.props.expanded).toBe(true);

  await rerender(<MenuView actions={actions(true)} />);

  expect(screen.container.queryAll((node) => node.props.text === 'First')).toHaveLength(0);
  expect(getPopups().at(-1)!.props.expanded).toBe(true);
});
