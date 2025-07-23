import { render, screen } from '@testing-library/react';
import * as React from 'react';

import { Table, THead, TBody, TFoot, TR, TH, TD, Caption } from '../Table';

const originalConsoleError = console.error;
beforeEach(() => {
  // Suppress console.error messages
  console.error = jest.fn(originalConsoleError);
});
afterAll(() => {
  // Restore console.error messages
  console.error = originalConsoleError;
});

it('renders Table', () => {
  render(<Table />);
  const table = screen.getByRole('table');
  expect(table).toBeDefined();
  // Ensure no console errors
  expect(console.error).not.toHaveBeenCalled();
});

it('renders complex table', () => {
  render(
    <Table>
      <Caption>Caption</Caption>
      <THead>
        <TR>
          <TH>Header</TH>
        </TR>
      </THead>
      <TBody>
        <TR>
          <TD>Row</TD>
        </TR>
      </TBody>
      <TFoot>
        <TR>
          <TD>Footer</TD>
        </TR>
      </TFoot>
    </Table>
  );
  const th = screen.getByRole('columnheader');
  expect(th).toBeDefined();
  // Ensure no console errors
  expect(console.error).not.toHaveBeenCalled();
});
