import { mergeClasses, SnackLogo } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { useEffect, useRef, useState, PropsWithChildren, ReactElement } from 'react';

import { Snippet } from '../Snippet';
import { SnippetAction } from '../SnippetAction';
import { SnippetContent } from '../SnippetContent';
import { SnippetHeader } from '../SnippetHeader';

import { cleanCopyValue, findPropInChildren } from '~/common/code-utilities';
import { SNACK_URL, getSnackFiles } from '~/common/snack';
import { PageApiVersionContextType, usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { CopyAction } from '~/ui/components/Snippet/actions/CopyAction';
import { SettingsAction } from '~/ui/components/Snippet/actions/SettingsAction';

const DEFAULT_PLATFORM = 'android';
const { LATEST_VERSION } = versions;

type Props = PropsWithChildren<{
  dependencies: string[];
  label?: string;
  defaultPlatform?: string;
  templateId?: string;
  files?: Record<string, string>;
  platforms?: string[];
  contentHidden?: boolean;
}>;

export const SnackInline = ({
  dependencies = [],
  label,
  defaultPlatform,
  templateId,
  files,
  platforms,
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

  const prismBlockClassName = findPropInChildren(children as ReactElement, 'className');
  const codeLanguage = prismBlockClassName ? prismBlockClassName.split('-')[1] : 'jsx';

  return (
    <Snippet className="flex flex-col mb-3 prose-pre:!m-0 prose-pre:!border-0">
      <SnippetHeader title={label || 'Example'} Icon={SnackLogo}>
        <form action={SNACK_URL} method="POST" target="_blank" className="contents">
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
                  codeLanguage,
                })
              )}
            />
          )}
          <CopyAction text={cleanCopyValue(getCode())} />
          <SnippetAction
            disabled={!isReady}
            rightSlot={<ArrowUpRightIcon className="icon-sm text-icon-secondary" />}
            type="submit">
            <span className="max-md-gutters:hidden">Open in </span>Snack
          </SnippetAction>
          <SettingsAction />
        </form>
      </SnippetHeader>
      <SnippetContent ref={contentRef} className={mergeClasses('p-0', contentHidden && 'hidden')}>
        {children}
      </SnippetContent>
    </Snippet>
  );
};
