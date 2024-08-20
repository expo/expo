'use client';

import { useLocalSearchParams as useSearchParams } from 'expo-router';
// import { useSearchParams } from 'next/navigation';
import { Fragment } from 'react';

// Ensure children are re-rendered when the search query changes
export default function ChildrenWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  return <Fragment key={searchParams.q}>{children}</Fragment>;
}
