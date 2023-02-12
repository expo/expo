import React, { PropsWithChildren, useEffect } from 'react';

import { H3 } from '~/ui/components/Text';

type Props = PropsWithChildren<object>;

export const ConfigPluginExample = ({ children }: Props) => {
  useEffect(() => {
    if (typeof children === 'string') {
      throw new Error(
        `Content inside 'ConfigPluginExample' needs to be surrounded by new lines to be parsed as markdown.\n\nMake sure there is a blank new line before and after this content: '${children}'`
      );
    }
  }, [children]);

  return (
    <>
      <H3>Example app.json with config plugin</H3>
      {children}
    </>
  );
};
