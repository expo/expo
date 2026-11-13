import 'react-native';
import { render } from '@testing-library/react-native';

import {
  B,
  BlockQuote,
  BR,
  Pre,
  Code,
  Del,
  EM,
  I,
  Mark,
  P,
  Q,
  S,
  Span,
  Strong,
  Time,
} from '../Text';

it('renders P', async () => {
  const { toJSON } = await render(<P>demo</P>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders B', async () => {
  const { toJSON } = await render(<B>demo</B>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Span', async () => {
  const { toJSON } = await render(<Span>demo</Span>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Strong', async () => {
  const { toJSON } = await render(<Strong>demo</Strong>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Del', async () => {
  const { toJSON } = await render(<Del>demo</Del>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders S', async () => {
  const { toJSON } = await render(<S>demo</S>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders I', async () => {
  const { toJSON } = await render(<I>demo</I>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders EM', async () => {
  const { toJSON } = await render(<EM>demo</EM>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders BR', async () => {
  const { toJSON } = await render(<BR />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Code', async () => {
  const { toJSON } = await render(<Code />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Q', async () => {
  const { toJSON } = await render(<Q>demo</Q>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders BlockQuote', async () => {
  const { toJSON } = await render(<BlockQuote />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Mark', async () => {
  const { toJSON } = await render(<Mark />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Time', async () => {
  const { toJSON } = await render(<Time dateTime="2001-05-15T19:00">May 15</Time>);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Pre', async () => {
  const { toJSON } = await render(
    <Pre>{`
    body {
      color: red;
    }
  `}</Pre>
  );
  expect(toJSON()).toMatchSnapshot();
});
