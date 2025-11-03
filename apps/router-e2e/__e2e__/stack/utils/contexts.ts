import { createContext, type useState } from 'react';

export const IsProtectedContext = createContext<ReturnType<typeof useState<boolean>>>([
  false,
  () => {},
]);
