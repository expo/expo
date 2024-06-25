import { useGlobalSearchParams } from 'expo-router';

export default function Root() {
  const params = useGlobalSearchParams();
  return <div data-testid="root-dynamic">{params.root}</div>;
}
