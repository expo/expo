import { useEffect, useState, PropsWithChildren } from 'react';

import { DiffBlock } from '~/ui/components/Snippet';

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
}>;

export const TemplateBareMinimumDiffViewer = ({ source, raw }: Props) => {
  const diffFile = '/static/diffs/template-bare-minimum/47..49.diff';

  return <DiffBlock source={diffFile} />;
};
