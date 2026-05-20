import { mergeClasses } from '@expo/styleguide';
import { useRouter } from 'next/compat/router';

import { WithTestRequire } from '~/types/common';
import { MarkdownActionsDropdown } from '~/ui/components/MarkdownActions/MarkdownActionsDropdown';
import { hasDynamicData, shouldShowMarkdownActions } from '~/ui/components/MarkdownActions/paths';
import { H1, P } from '~/ui/components/Text';

import { AskPageAIConfigTrigger, AskPageAITrigger } from '../AskPageAI';
import { PageCliVersion } from './PageCliVersion';
import { PagePackageVersion } from './PagePackageVersion';
import { PagePlatformTags } from './PagePlatformTags';
import { PageTitleButtons } from './PageTitleButtons';

type Props = {
  title?: string;
  description?: string;
  packageName?: string;
  cliVersion?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
  platforms?: string[];
  showAskAIButton?: boolean;
  onAskAIClick?: () => void;
  isAskAIVisible?: boolean;
  askAIButtonVariant?: 'default' | 'config';
} & WithTestRequire;

export function PageHeader({
  title,
  description,
  packageName,
  cliVersion,
  iconUrl,
  sourceCodeUrl,
  platforms,
  testRequire,
  showAskAIButton = false,
  onAskAIClick,
  isAskAIVisible = false,
  askAIButtonVariant = 'default',
}: Props) {
  const router = useRouter();
  const currentPath = router?.asPath ?? router?.pathname ?? '';
  const showMarkdownActions = shouldShowMarkdownActions({
    packageName,
    path: currentPath,
  });
  const showPackageMarkdown = packageName ? !hasDynamicData(currentPath) : false;
  const isSdkPage = currentPath.includes('/sdk/');
  const hasAskAIButton = showAskAIButton && !!onAskAIClick;

  const renderAskAIButton = () => {
    if (!hasAskAIButton) {
      return null;
    }

    if (askAIButtonVariant === 'config') {
      return <AskPageAIConfigTrigger onClick={onAskAIClick} isActive={isAskAIVisible} />;
    }

    return <AskPageAITrigger onClick={onAskAIClick} isActive={isAskAIVisible} />;
  };

  if (packageName && isSdkPage) {
    return (
      <>
        <div className="mt-2 flex flex-col">
          <H1 className="my-0!">
            {iconUrl && (
              <img
                src={iconUrl}
                className="relative -top-0.5 float-left mr-3.5 size-10.5"
                alt={`Expo ${title} icon`}
              />
            )}
            {packageName && packageName.startsWith('expo-') && 'Expo '}
            {title}
          </H1>
          {description && (
            <P theme="secondary" data-description="true" className="mt-2">
              {description}
            </P>
          )}
          {cliVersion && <PageCliVersion cliVersion={cliVersion} className="mt-3" />}
          {platforms && <PagePlatformTags platforms={platforms} className="mt-4" />}
        </div>
        <div
          className={mergeClasses(
            'mt-4 flex flex-wrap items-center justify-between gap-3 pb-1',
            'max-md:flex-col max-md:items-stretch max-md:gap-0 max-md:pb-0'
          )}>
          <div
            className={mergeClasses(
              'flex flex-wrap items-center gap-2',
              'max-md:w-full max-md:items-center max-md:justify-between max-md:border-b max-md:border-default max-md:py-3'
            )}>
            <div className="flex flex-wrap items-center">{renderAskAIButton()}</div>
            <div className="flex items-center gap-1.5">
              <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
            </div>
          </div>
          <div
            className={mergeClasses(
              'flex flex-wrap items-center gap-3',
              'max-md:w-full max-md:justify-between max-md:py-3'
            )}>
            <PagePackageVersion
              packageName={packageName}
              testRequire={testRequire}
              showMarkdownActions={showPackageMarkdown}
              className="max-md:w-full max-md:justify-between"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={mergeClasses(
          'mt-2 flex items-start justify-between gap-4',
          'max-xl:flex-col max-xl:items-start'
        )}>
        <H1 className="my-0!">
          {iconUrl && (
            <img
              src={iconUrl}
              className="relative -top-0.5 float-left mr-3.5 size-10.5"
              alt={`Expo ${title} icon`}
            />
          )}
          {packageName && packageName.startsWith('expo-') && 'Expo '}
          {title}
        </H1>
        <span className="-mt-0.5 flex items-center gap-1 max-xl:hidden">
          <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
          {(showMarkdownActions || hasAskAIButton) && (
            <span className="flex items-center gap-1">
              {hasAskAIButton && askAIButtonVariant === 'config' && (
                <AskPageAIConfigTrigger onClick={onAskAIClick} isActive={isAskAIVisible} />
              )}
              {showMarkdownActions && <MarkdownActionsDropdown />}
              {hasAskAIButton && askAIButtonVariant !== 'config' && (
                <AskPageAITrigger onClick={onAskAIClick} isActive={isAskAIVisible} />
              )}
            </span>
          )}
        </span>
      </div>
      {description && (
        <P theme="secondary" data-description="true">
          {description}
        </P>
      )}
      {cliVersion && <PageCliVersion cliVersion={cliVersion} className="mt-3 max-xl:mt-2" />}
      <span className="mt-3 mb-1 hidden items-center gap-1 max-xl:flex">
        <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
        {(showMarkdownActions || hasAskAIButton) && (
          <span className="ml-1 flex items-center gap-1">
            {hasAskAIButton && askAIButtonVariant === 'config' && (
              <AskPageAIConfigTrigger onClick={onAskAIClick} isActive={isAskAIVisible} />
            )}
            {showMarkdownActions && <MarkdownActionsDropdown />}
            {hasAskAIButton && askAIButtonVariant !== 'config' && (
              <AskPageAITrigger onClick={onAskAIClick} isActive={isAskAIVisible} />
            )}
          </span>
        )}
      </span>
      <div
        className={mergeClasses(
          'mt-3 flex items-center justify-between',
          'max-md:flex-col-reverse max-md:items-start max-md:gap-3',
          'empty:hidden'
        )}>
        {platforms && <PagePlatformTags platforms={platforms} />}
        {packageName && (
          <PagePackageVersion
            packageName={packageName}
            testRequire={testRequire}
            showMarkdownActions={showPackageMarkdown}
          />
        )}
      </div>
    </>
  );
}
