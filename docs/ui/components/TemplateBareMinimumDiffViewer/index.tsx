import { css } from '@emotion/react';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { useEffect, useState, PropsWithChildren } from 'react';

import { VersionSelector } from './VersionSelector';

import { DiffBlock } from '~/ui/components/Snippet';

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
}>;

export const TemplateBareMinimumDiffViewer = ({ source, raw }: Props) => {
  const diffFile = '/static/diffs/template-bare-minimum/47..49.diff';
  const [fromVersion, setFromVersion] = useState<string>('49');
  const [toVersion, setToVersion] = useState<string>('49');

  const versions = ['v49.0.0', 'v48.0.0', 'v47.0.0'];

  return (
    <div>
      <div
        css={css({
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing[4],
        })}>
        <div css={selectorOuterStyle}>
          <VersionSelector
            version={fromVersion}
            setVersion={setFromVersion}
            availableVersions={versions}
          />
        </div>
        <div css={selectorOuterStyle}>
          <VersionSelector
            version={toVersion}
            setVersion={setToVersion}
            availableVersions={versions}
          />
        </div>
      </div>
      <DiffBlock
        source={diffFile}
        filenameModifier={str => str.replace('templates/expo-template-bare-minimum/', '')}
        showOperation
        collapseDeletedFiles
      />
    </div>
  );
};

const selectorOuterStyle = css({
  flex: 1,
});
