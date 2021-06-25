import React, { PropsWithChildren, useCallback, useState } from 'react';

import { GroupTitle } from './GroupTitle';

type GroupProps = PropsWithChildren<{
  title: string;
  isOpen?: boolean;
}>;

export const Group = ({ children, title, isOpen = true }: GroupProps) => {
  const [open, setOpen] = useState(isOpen);
  const toggleOpen = useCallback(() => setOpen(state => !state), []);

  return (
    <div>
      <GroupTitle isOpen={open} onClick={toggleOpen}>
        {title}
      </GroupTitle>
      {open && children}
    </div>
  );
};
