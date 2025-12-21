import { mergeClasses } from '@expo/styleguide';
import { useRouter } from 'next/compat/router';

import { WithTestRequire } from '~/types/common';
import { MarkdownActionsDropdown } from '~/ui/components/MarkdownActions/MarkdownActionsDropdown';
import { hasDynamicData, shouldShowMarkdownActions } from '~/ui/components/MarkdownActions/paths';
import { H1, P } from '~/ui/components/Text';

import { AskPageAIConfigTrigger, AskPageAITrigger } from '../AskPageAI';
import { PagePackageVersion } from './PagePackageVersion';
import { PagePlatformTags } from './PagePlatformTags';
import { PageTitleButtons } from './PageTitleButtons';

type Props = {
  title?: string;
  description?: string;
  packageName?: string;
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
          <H1 className="!my-0">
            {iconUrl && (
              <img
                src={iconUrl}
                className="relative -top-0.5 float-left mr-3.5 size-[42px]"
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
          {platforms && <PagePlatformTags platforms={platforms} className="mt-4" />}
        </div>
        <div
          className={mergeClasses(
            'mt-4 flex flex-wrap items-center justify-between gap-3 pb-1',
            'max-md-gutters:flex-col max-md-gutters:items-stretch max-md-gutters:gap-0 max-md-gutters:pb-0'
          )}>
          <div
            className={mergeClasses(
              'flex flex-wrap items-center gap-2',
              'max-md-gutters:w-full max-md-gutters:items-center max-md-gutters:justify-between max-md-gutters:border-b max-md-gutters:border-default max-md-gutters:py-3'
            )}>
            <div className="flex flex-wrap items-center">
              {renderAskAIButton()}
              {hasAskAIButton && (sourceCodeUrl || packageName) && (
                <div className="max-sm:hidden bg-secondary mx-1 h-5 w-px" />
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
            </div>
          </div>
          <div
            className={mergeClasses(
              'flex flex-wrap items-center gap-3',
              'max-md-gutters:w-full max-md-gutters:justify-between max-md-gutters:py-3'
            )}>
            <PagePackageVersion
              packageName={packageName}
              testRequire={testRequire}
              showMarkdownActions={showPackageMarkdown}
              className="max-md-gutters:w-full max-md-gutters:justify-between"
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
          'max-xl-gutters:flex-col max-xl-gutters:items-start'
        )}>
        <H1 className="!my-0">
          {iconUrl && (
            <img
              src={iconUrl}
              className="relative -top-0.5 float-left mr-3.5 size-[42px]"
              alt={`Expo ${title} icon`}
            />
          )}
          {packageName && packageName.startsWith('expo-') && 'Expo '}
          {title}
        </H1>
        <span className="-mt-0.5 flex items-center gap-1 max-xl-gutters:hidden">
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
      <span className="mb-1 mt-3 hidden items-center gap-1 max-xl-gutters:flex">
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
          'max-md-gutters:flex-col-reverse max-md-gutters:items-start max-md-gutters:gap-3',
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
