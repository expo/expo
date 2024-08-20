export function revalidateTag(path: string) {
  console.warn('TODO: Implement revalidateTag');
}

export function headers() {
  console.warn('TODO: Implement headers');

  return {
    get(key: string) {
      return 'x-shopify-topic';
    }
  };
}

// import { cookies } from 'next/headers';
export function cookies() {
  console.warn('TODO: Implement headers');
  return {
    get(key: string) {
      return { value: 'TODO' };
    }
  };
}

// import { notFound } from 'next/navigation';
export function notFound(): never {
  throw new Error('UNIMPLEMENTED: Not found');
}

import { useLocalSearchParams } from 'expo-router';
export function useSearchParams() {
  const params = useLocalSearchParams();
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    search.set(key, value);
  });
  return search;
}
