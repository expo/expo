import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { LI, UL } from '../Lists';

it('renders UL nested in UL', () => {
  render(
    <UL testID="ul">
      <LI>item</LI>
      <UL>
        <LI>item</LI>
      </UL>
    </UL>
  );

  const ul = screen.getByTestId('ul');
  expect(ul).toBeDefined();
});

it('renders a single UL with multiple LI children', () => {
  render(
    <UL>
      <LI>item 1</LI>
      <LI>item 2</LI>
      <LI>item 3</LI>
    </UL>
  );

  const listItems = screen.getAllByRole('listitem');
  expect(listItems[0]).toHaveTextContent(/item 1/);
  expect(listItems[1]).toHaveTextContent(/item 2/);
  expect(listItems[2]).toHaveTextContent(/item 3/);
  expect(listItems[2]).toHaveTextContent('item 3');
});

it('renders an empty UL without crashing', () => {
  render(<UL />);
  const ul = screen.getByRole('list');
  expect(ul).toBeDefined();
  expect(ul.children).toHaveLength(0);
});
