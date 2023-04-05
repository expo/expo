import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import '../styles/global.css';

export default function Layout() {
  return (
    <>
      <Head>
        <meta name="fake" content="bar" />
      </Head>
      <Stack />;
    </>
  );
}
