import { css } from '@emotion/react';
import { SnackLogo } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import { useEffect, useRef, useState, PropsWithChildren } from 'react';

import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

import { SNACK_URL, getSnackFiles } from '~/common/snack';
import { PageApiVersionContextType, usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';

const DEFAULT_PLATFORM = 'android';
const { LATEST_VERSION } = versions;

type Props = PropsWithChildren<{
  dependencies: string[];
  label?: string;
  defaultPlatform?: string;
  templateId?: string;
  files?: Record<string, string>;
  platforms?: string[];
  buttonTitle?: string;
  contentHidden?: boolean;
}>;

export const SnackInline = ({
  dependencies = [],
  label,
  defaultPlatform,
  templateId,
  files,
  platforms,
  buttonTitle,
  contentHidden,
  children,
}: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isReady, setReady] = useState(false);
  const context = usePageApiVersion();

  useEffect(() => setReady(true), []);

  // Filter out `latest` and use the concrete latest version instead. We want to
  // keep `unversioned` in for the selected docs version though. This is used to
  // find the examples in the static dir, and we don't have a `latest` version
  // there, but we do have `unversioned`.
  const getSelectedDocsVersion = () => {
    const { version } = context as PageApiVersionContextType;
    return version === 'latest' ? LATEST_VERSION : version;
  };

  // Get a SDK version that Snack will understand. `latest` and `unversioned`
  // are meaningless to Snack so we filter those out and use `LATEST_VERSION` instead
  const getSnackSdkVersion = () => {
    let version = getSelectedDocsVersion();
    if (version === 'unversioned') {
      version = LATEST_VERSION;
    }

    return version.replace('v', '');
  };

  const getExamplesPath = () => {
    return `${document.location.origin}/static/examples/${getSelectedDocsVersion()}`;
  };

  const getCode = () => {
    const code = contentRef.current ? contentRef.current.textContent || '' : '';
    return code.replace(/%%placeholder-start%%.*%%placeholder-end%%/g, '');
  };

  return (
    <Snippet css={inlineSnackWrapperStyle}>
      <SnippetHeader title={label || 'Example'}>
        <form action={SNACK_URL} method="POST" target="_blank">
          <input type="hidden" name="platform" value={defaultPlatform || DEFAULT_PLATFORM} />
          <input type="hidden" name="name" value={label || 'Example'} />
          <input type="hidden" name="dependencies" value={dependencies.join(',')} />
          <input type="hidden" name="sdkVersion" value={getSnackSdkVersion()} />
          {platforms && (
            <input type="hidden" name="supportedPlatforms" value={platforms.join(',')} />
          )}
          {isReady && (
            <input
              type="hidden"
              name="files"
              value={JSON.stringify(
                getSnackFiles({
                  templateId,
                  code: getCode(),
                  files,
                  baseURL: getExamplesPath(),
                })
              )}
            />
          )}
          <SnippetAction
            disabled={!isReady}
            icon={<SnackLogo />}
            iconRight={<ArrowUpRightIcon className="icon-sm text-icon-secondary" />}
            type="submit">
            {buttonTitle || 'Open in Snack'}
          </SnippetAction>
        </form>
      </SnippetHeader>
      <SnippetContent ref={contentRef} css={contentHidden && css({ display: 'none' })} skipPadding>
        {children}
      </SnippetContent>
    </Snippet>
  );
};

const inlineSnackWrapperStyle = css({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: spacing[3],

  pre: {
    margin: 0,
    border: 0,
  },
});
