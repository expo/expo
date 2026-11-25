import 'react-native';
import { render } from '@testing-library/react-native';

import { Table, THead, TBody, TFoot, TR, TH, TD, Caption } from '../Table';

it('renders Table', async () => {
  const { toJSON } = await render(<Table />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders THead', async () => {
  const { toJSON } = await render(<THead />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TBody', async () => {
  const { toJSON } = await render(<TBody />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TFoot', async () => {
  const { toJSON } = await render(<TFoot />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TH', async () => {
  const { toJSON } = await render(<TH>Header</TH>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TR', async () => {
  const { toJSON } = await render(<TR />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders TD', async () => {
  const { toJSON } = await render(<TD>Column</TD>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Caption', async () => {
  const { toJSON } = await render(<Caption>Caption</Caption>);
  expect(toJSON()).toMatchSnapshot();
});
