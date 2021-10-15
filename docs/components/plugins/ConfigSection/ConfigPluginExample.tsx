import React, { PropsWithChildren } from 'react';

import { H3 } from '~/components/plugins/Headings';

type Props = PropsWithChildren<object>;

export const ConfigPluginExample = ({ children }: Props) => (
  <>
    <H3>Example app.json with config plugin</H3>
    {children}
  </>
);
