import { type PropsWithChildren } from 'react';

export const Grid = ({ children }: PropsWithChildren) => (
  <div className="inline-grid w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
    {children}
  </div>
);
