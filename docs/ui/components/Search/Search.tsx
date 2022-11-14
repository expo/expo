import { Global } from '@emotion/react';
import { useState } from 'react';

import { CommandMenu, CommandMenuTrigger } from '../CommandMenu';
import { commandMenuStyles } from '../CommandMenu/styles';

import { usePageApiVersion } from '~/providers/page-api-version';

export const Search = () => {
  const { version } = usePageApiVersion();

  const [open, setOpen] = useState(false);

  return (
    <>
      <Global styles={commandMenuStyles} />
      <CommandMenu version={version} open={open} setOpen={setOpen} />
      <CommandMenuTrigger setOpen={setOpen} />
    </>
  );
};
