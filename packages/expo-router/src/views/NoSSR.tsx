import React from 'react';

export function NoSSR({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    // If the component is not mounted, return null to prevent server-side rendering.
    return null;
  }
  // This component is used to prevent server-side rendering of its children.
  // It can be useful for components that rely on browser-specific APIs or
  // need to be rendered only on the client side.
  return <>{children}</>;
}
