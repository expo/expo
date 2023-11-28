import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import { useRouter } from 'next/compat/router';
import { PropsWithChildren, useEffect, useState } from 'react';

import { VersionSelector } from './VersionSelector';

import versions from '~/public/static/constants/versions.json';
import diffInfo from '~/public/static/diffs/template-bare-minimum/diffInfo.json';
import { DiffBlock } from '~/ui/components/Snippet';
import { PermalinkedSnippetHeader } from '~/ui/components/Snippet/SnippetHeader';
import { RawH3, RawH4 } from '~/ui/components/Text';

// versions used by SDK selector. This has "unversioned" removed on production versions. The diff selectors will match that.
const { VERSIONS } = versions;

type Props = PropsWithChildren<{
  source?: string;
  raw?: string;
}>;

export const TemplateBareMinimumDiffViewer = ({ source, raw }: Props) => {
  const router = useRouter();

  console.log(router?.asPath);

  let bareDiffVersions = diffInfo.versions.slice();

  // default to from: last SDK, to: current SDK
  const lastTwoProductionVersions = bareDiffVersions
    .filter((d: string) => d !== 'unversioned')
    .slice(-2);

  // keep versions in state for instant updates to the dropdown
  const [fromVersion, setFromVersion] = useState(
    (router?.query.fromSdk as string) || lastTwoProductionVersions[0]
  );
  const [toVersion, setToVersion] = useState(
    (router?.query.toSdk as string) || lastTwoProductionVersions[1]
  );

  // then sync the state to the search params (on initial load without params and when the dropdown changes)
  useEffect(() => {
    if (!router?.query.from) {
      router?.push({ query: { fromSdk: fromVersion, toSdk: toVersion } });
    }
  }, [fromVersion, toVersion]);

  // remove unversioned if this environment doesn't show it in the SDK reference
  if (!VERSIONS.find((version: string) => version === 'unversioned')) {
    bareDiffVersions = bareDiffVersions.filter((version: string) => version !== 'unversioned');
  }

  const maxVersion = bareDiffVersions.reduce((a: string, b: string) =>
    a === 'unversioned' ? 'unversioned' : a > b ? a : b
  );

  const diffName = `${fromVersion}..${toVersion}`;
  const diff = diffInfo.diffs[diffName as keyof typeof diffInfo.diffs];

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
          <RawH4>From SDK version:</RawH4>
          <VersionSelector
            version={fromVersion}
            setVersion={setFromVersion}
            availableVersions={bareDiffVersions.filter((version: string) => version !== maxVersion)}
          />
        </div>
        <div css={selectorOuterStyle}>
          <RawH4>To SDK version:</RawH4>
          <VersionSelector
            version={toVersion}
            setVersion={setToVersion}
            availableVersions={bareDiffVersions.filter((version: string) => version > fromVersion)}
          />
        </div>
      </div>
      {fromVersion !== toVersion ? (
        <>
          <RawH3>
            Native code changes from SDK {fromVersion} to {toVersion}
          </RawH3>
          <DiffBlock
            raw={diff}
            filenameModifier={str => str.replace('templates/expo-template-bare-minimum/', '')}
            showOperation
            collapseDeletedFiles
            SnippetHeaderComponent={PermalinkedSnippetHeader}
          />
        </>
      ) : null}
    </div>
  );
};

const selectorOuterStyle = css({
  flex: 1,
});
