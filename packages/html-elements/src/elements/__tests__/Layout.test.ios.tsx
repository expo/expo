import 'react-native';
import { render } from '@testing-library/react-native';

import { Article, Aside, Footer, Header, Main, Nav, Section } from '../Layout';

it('renders Footer', async () => {
  const { toJSON } = await render(<Footer />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Nav', async () => {
  const { toJSON } = await render(<Nav />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Aside', async () => {
  const { toJSON } = await render(<Aside />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Header', async () => {
  const { toJSON } = await render(<Header />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Main', async () => {
  const { toJSON } = await render(<Main />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Section', async () => {
  const { toJSON } = await render(<Section />);
  expect(toJSON()).toMatchSnapshot();
});

it('renders Article', async () => {
  const { toJSON } = await render(<Article />);
  expect(toJSON()).toMatchSnapshot();
});
