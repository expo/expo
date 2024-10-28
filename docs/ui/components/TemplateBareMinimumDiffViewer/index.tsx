import { mergeClasses } from '@expo/styleguide';
import { useRouter } from 'next/compat/router';
import { useEffect } from 'react';

import { VersionSelector } from './VersionSelector';

import { betaVersion } from '~/package.json';
import versions from '~/public/static/constants/versions.json';
import diffInfo from '~/public/static/diffs/template-bare-minimum/diffInfo.json';
import { DiffBlock } from '~/ui/components/Snippet';
import { PermalinkedSnippetHeader } from '~/ui/components/Snippet/PermalinkedSnippetHeader';
import { RawH3, RawH4 } from '~/ui/components/Text';

// versions used by SDK selector. This has "unversioned" removed on production versions. The diff selectors will match that.
const { VERSIONS } = versions;
const BETA_MAJOR_VERSION = betaVersion.split('.')[0];

export const TemplateBareMinimumDiffViewer = () => {
  const router = useRouter();

  let bareDiffVersions = diffInfo.versions.slice();

  // default to from: last SDK, to: current SDK
  const lastTwoProductionVersions = bareDiffVersions
    .filter((d: string) => d !== 'unversioned' && d !== BETA_MAJOR_VERSION)
    .slice(-2);

  const fromVersion = router?.query.fromSdk || lastTwoProductionVersions[0];
  const toVersion = router?.query.toSdk || lastTwoProductionVersions[1];

  // Ensure that URL always contains from and to SDK version, even on first load
  // to avoid copying links that would change with new SDK versions.
  useEffect(() => {
    if (router?.isReady && (!router?.query.fromSdk || !router?.query.toSdk)) {
      router?.push({ query: { fromSdk: fromVersion, toSdk: toVersion } });
    }
  }, [router?.query.fromSdk, router?.query.toSdk, router?.isReady]);

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
    <>
      <div
        className={mergeClasses(
          'grid grid-cols-2 gap-4',
          'max-sm-gutters:grid-cols-1 max-sm-gutters:gap-0'
        )}>
        <div>
          <RawH4 className="max-sm-gutters:!my-0">From SDK version:</RawH4>
          <VersionSelector
            version={fromVersion as string}
            setVersion={newFromVersion =>
              router?.push({ query: { fromSdk: newFromVersion, toSdk: toVersion } })
            }
            availableVersions={bareDiffVersions.filter((version: string) => version !== maxVersion)}
          />
        </div>
        <div>
          <RawH4 className="max-sm-gutters:!my-0">To SDK version:</RawH4>
          <VersionSelector
            version={toVersion as string}
            setVersion={newToVersion =>
              router?.push({ query: { fromSdk: fromVersion, toSdk: newToVersion } })
            }
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
            key={diffName /* force re-mount on raw diff change */}
            raw={diff}
            filenameModifier={str => str.replace('templates/expo-template-bare-minimum/', '')}
            showOperation
            collapseDeletedFiles
            SnippetHeaderComponent={PermalinkedSnippetHeader}
            filenameToLinkUrl={filename =>
              `https://github.com/expo/expo/tree/sdk-${toVersion}/${filename}`
            }
          />
        </>
      ) : null}
    </>
  );
};
