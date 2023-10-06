import { css } from '@emotion/react';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { useEffect, useState, PropsWithChildren } from 'react';

import { VersionSelector } from './VersionSelector';

import { DiffBlock } from '~/ui/components/Snippet';
import { H3, H4 } from '~/ui/components/Text';

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
}>;

export const TemplateBareMinimumDiffViewer = ({ source, raw }: Props) => {
  const diffFile = '/static/diffs/template-bare-minimum/48..49.diff';
  const [fromVersion, setFromVersion] = useState<string>('48');
  const [toVersion, setToVersion] = useState<string>('49');

  const versions = ['47', '48', '49'];

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
          <H4>From SDK version:</H4>
          <VersionSelector
            version={fromVersion}
            setVersion={setFromVersion}
            availableVersions={versions}
          />
        </div>
        <div css={selectorOuterStyle}>
          <H4>To SDK version:</H4>
          <VersionSelector
            version={toVersion}
            setVersion={setToVersion}
            availableVersions={versions.filter(version => version > fromVersion)}
          />
        </div>
      </div>
      {fromVersion !== toVersion ? (
        <>
          <H3>
            Native code changes from SDK {fromVersion} to {toVersion}
          </H3>
          <DiffBlock
            source={diffFile}
            filenameModifier={str => str.replace('templates/expo-template-bare-minimum/', '')}
            showOperation
            collapseDeletedFiles
          />
        </>
      ) : null}
    </div>
  );
};

const selectorOuterStyle = css({
  flex: 1,
});
