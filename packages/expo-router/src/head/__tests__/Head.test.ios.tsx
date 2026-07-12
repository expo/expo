import { screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderRouter } from '../../testing-library';
import { Head } from '../ExpoHead';
import { ExpoHead } from '../ExpoHeadModule';

jest.mock('../ExpoHeadModule', () => ({
  ExpoHead: {
    activities: {
      INDEXED_ROUTE: 'indexed-route',
    },
    createActivity: jest.fn(),
    suspendActivity: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      router: {
        headOrigin: 'https://example.com',
      },
    },
  },
}));

const mockedExpoHead = ExpoHead as jest.Mocked<NonNullable<typeof ExpoHead>>;

beforeEach(() => {
  mockedExpoHead.createActivity.mockClear();
  mockedExpoHead.suspendActivity.mockClear();
});

it('registers focused route metadata with the native head module', async () => {
  const result = renderRouter(
    {
      index: () => (
        <>
          <Head>
            <title>Home title</title>
            <meta property="og:description" content="Home description" />
            <meta property="expo:handoff" content="true" />
            <meta property="expo:spotlight" content="true" />
            <meta property="og:url" content="/custom-home" />
          </Head>
          <Text testID="screen">Home</Text>
        </>
      ),
    },
    { initialUrl: '/' }
  );

  expect(screen.getByTestId('screen')).toBeVisible();

  await waitFor(() => expect(mockedExpoHead.createActivity).toHaveBeenCalled());

  expect(mockedExpoHead.createActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      id: '-',
      activityType: 'indexed-route',
      title: 'Home title',
      description: 'Home description',
      webpageURL: 'https://example.com/custom-home',
      keywords: ['Home title'],
      isEligibleForHandoff: true,
      isEligibleForSearch: true,
      userInfo: {
        href: 'https://example.com/',
      },
    })
  );

  result.unmount();
  expect(mockedExpoHead.suspendActivity).toHaveBeenCalledWith('-');
});

it('uses Open Graph title metadata and the route URL as fallbacks', async () => {
  renderRouter(
    {
      article: () => (
        <Head>
          <meta property="og:title" content="Article title" />
          <meta property="expo:spotlight" content="true" />
        </Head>
      ),
    },
    { initialUrl: '/article' }
  );

  await waitFor(() => expect(mockedExpoHead.createActivity).toHaveBeenCalled());

  expect(mockedExpoHead.createActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      id: '-article',
      title: 'Article title',
      webpageURL: 'https://example.com/article',
      isEligibleForSearch: true,
    })
  );
});
