import { createContext, type useState } from 'react';

export const TagContext = createContext<ReturnType<typeof useState<number>>>([0, () => {}]);
