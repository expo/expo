/*
 * Do not correct the TypeScript errors in this file

 * It is expected that TypeScript will mark the @ts-expect-error in this file as invalid
 * These types only becoming invalid AFTER the Typed Routes have been generated
 * This is because Typed Routes narrow the type `string` to a union of strings.
 */
import { Href, useGlobalSearchParams, useLocalSearchParams, useSegments, Link } from 'expo-router';

const SiteMap: Href = '/_sitemap';
const StaticRouteString: Href = '/about';
const StaticRouteObject: Href = {
  pathname: './about',
};
const StaticRouteObjectWithParms: Href = {
  pathname: './about',
  params: { test: 'value' },
};
// @ts-expect-error
const InvalidStaticRoute: Href = '/invalid';

function useLocalSearchParamsTest() {
  const anyParams = useLocalSearchParams();
  const aboutParams = useLocalSearchParams<'/about'>();

  // @ts-expect-error - This is not a valid route
  useLocalSearchParams<'/invalid'>();

  // They always can accept a string-index
  const anyValue: string | string[] = anyParams['string-index'];
  const aboutAnyValue: string | string[] = aboutParams['string-index'];

  // @ts-expect-error - This is not a valid route
  useLocalSearchParams<'/fruit/invalid'>();

  let fruitValue: string = useLocalSearchParams<'/fruit/[fruit]'>()['fruit'];
  fruitValue = useLocalSearchParams<'/(a)/fruit/[fruit]'>()['fruit'];

  let otherValue: { fruit: string; other: string[] } =
    useLocalSearchParams<'/fruit/[fruit]/[...other]'>();
  otherValue = useLocalSearchParams<'/(a)/fruit/[fruit]/[...other]'>();

  let objectValue: { custom: string; customArray: string[] } = useLocalSearchParams<{
    custom: string;
    customArray: string[];
  }>();
}

function useGlobalSearchParamsTest() {
  const anyParams = useGlobalSearchParams();
  const aboutParams = useGlobalSearchParams<'/about'>();

  // @ts-expect-error - This is not a valid route
  useGlobalSearchParams<'/invalid'>();

  // They always can accept a string-index
  const anyValue: string | string[] = anyParams['string-index'];
  const aboutAnyValue: string | string[] = aboutParams['string-index'];

  // @ts-expect-error - This is not a valid route
  useGlobalSearchParams<'/fruit/invalid'>();

  let fruitValue: string = useGlobalSearchParams<'/fruit/[fruit]'>()['fruit'];
  fruitValue = useGlobalSearchParams<'/(a)/fruit/[fruit]'>()['fruit'];

  let otherValue: { fruit: string; other: string[] } =
    useGlobalSearchParams<'/fruit/[fruit]/[...other]'>();
  otherValue = useGlobalSearchParams<'/(a)/fruit/[fruit]/[...other]'>();

  let objectValue: { custom: string; customArray: string[] } = useGlobalSearchParams<{
    custom: string;
    customArray: string[];
  }>();

  let mixedParams: {
    fruit: string;
    custom: string;
    customArray: string[];
  } = useGlobalSearchParams<
    '/fruit/[fruit]',
    {
      custom: string;
      customArray: string[];
    }
  >();

  // @ts-expect-error - string is not assignable to type string[]
  let invalidMixedParams: {
    fruit: string[];
    custom: string;
    customArray: string[];
  } = useGlobalSearchParams<
    '/fruit/[fruit]',
    {
      custom: string;
      customArray: string[];
    }
  >();
}

function useSegmentsTest() {
  const plainSegements = useSegments();
  const firstUnion: '' | 'about' | 'fruit' | '(a)' | '_sitemap' = plainSegements[0];
  const secondUnion: 'fruit' | '[fruit]' | undefined = plainSegements[1];
  const thirdUnion: '[fruit]' | '[...other]' = plainSegements[2];
  const forthUnion: '[...other]' = plainSegements[3];
  // @ts-expect-error - No extra segments are possible
  plainSegements[4];

  const appleSegments = useSegments<'/fruit/[fruit]'>();
  const firstAppleUnion: 'fruit' = appleSegments[0];
  const secondAppleUnion: '[fruit]' = appleSegments[1];
  // @ts-expect-error - No extra segments are possible
  appleSegments[2];
}

const link = (
  <>
    <Link href="/about" />
    <Link href={{ pathname: '/about' }} />
    {/*  @ts-expect-error */}
    <Link href={{ pathname: '/invalid' }} />
    {/*  @ts-expect-error - Missing params */}
    <Link href={{ pathname: '/(a)/fruit/[fruit]' }} />
    {/*  @ts-expect-error - Missing fruit param */}
    <Link href={{ pathname: '/(a)/fruit/[fruit]', params: {} }} />
    <Link
      href={{
        pathname: '/(a)/fruit/[fruit]',
        params: {
          // @ts-expect-error - string[] is not assignable to string
          fruit: ['test'],
        },
      }}
    />
    <Link
      href={{
        pathname: '/(a)/fruit/[fruit]',
        params: {
          fruit: 'test',
          test: 'other',
          number: 1,
        },
      }}
    />
    <Link href="/fruit/apple" />
    <Link href={`/fruit/${'apple'}`} />
    {/* @ts-expect-error - /fruit2/${string} is not valid */}
    <Link href={`/fruit2/${'apple'}`} />
  </>
);

export default function Page() {
  return null;
}
