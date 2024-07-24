import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Page() {
  const { '#': hash } = useLocalSearchParams();
  const router = useRouter();

  return (
    <>
      <div data-testid="hash">{hash}</div>
      <button data-testid="set-hash-test" onClick={() => router.setParams({ '#': 'test' })}>
        Set hash to test
      </button>
      <button data-testid="clear-hash" onClick={() => router.setParams({ '#': '' })}>
        Clear hash
      </button>
    </>
  );
}
