import { type PropsWithChildren } from 'react';

export const Grid = ({ children }: PropsWithChildren) => (
  <div className="inline-grid w-full gap-5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
    {children}
  </div>
);
