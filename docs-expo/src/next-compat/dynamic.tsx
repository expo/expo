import { lazy, Suspense, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';

type Loader<Props> = () => Promise<ComponentType<Props> | { default: ComponentType<Props> }>;

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => ReactNode;
};

function subscribeToNothing() {
  return () => {};
}

/** The `next/dynamic` function, built on `React.lazy`. */
export default function dynamic<Props extends object>(
  loader: Loader<Props>,
  { ssr = true, loading }: DynamicOptions = {}
) {
  const LazyComponent = lazy(async () => {
    const loaded = await loader();
    return typeof loaded === 'function' ? { default: loaded } : loaded;
  });

  return function DynamicComponent(props: Props) {
    const isClient = useSyncExternalStore(
      subscribeToNothing,
      () => true,
      () => false
    );
    const fallback = loading?.() ?? null;

    if (!ssr && !isClient) {
      return fallback;
    }
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}
