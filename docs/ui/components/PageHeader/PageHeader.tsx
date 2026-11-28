import { useRouter } from 'next/compat/router';

import { WithTestRequire } from '~/types/common';
import { MarkdownActionsDropdown } from '~/ui/components/MarkdownActions/MarkdownActionsDropdown';
import {
  hasDynamicData,
  normalizePath,
  shouldShowMarkdownActions,
} from '~/ui/components/MarkdownActions/paths';
import { H1, P } from '~/ui/components/Text';

import { AskPageAIConfigTrigger, AskPageAITrigger } from '../AskPageAI/AskPageAITrigger';
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
    path: router?.isReady ? currentPath : normalizePath(currentPath),
  });
  const showPageActions = packageName ? !hasDynamicData(currentPath) : showMarkdownActions;
  const isSdkPage = currentPath.includes('/sdk/');
  const isSdkPackagePage = !!packageName && isSdkPage;
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 xl:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
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
            <P
              theme="secondary"
              weight="medium"
              data-description="true"
              className="text-sm leading-[1.4]">
              {description}
            </P>
          )}
          {cliVersion && <PageCliVersion cliVersion={cliVersion} className="mt-2" />}
        </div>
        <div className="flex shrink-0 items-center gap-1 empty:hidden xl:order-first xl:-mt-10.75 xl:self-end">
          {!isSdkPackagePage && (
            <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
          )}
          {!isSdkPackagePage && askAIButtonVariant === 'config' && renderAskAIButton()}
          {showPageActions && <MarkdownActionsDropdown isSplit={isSdkPackagePage} />}
          {!isSdkPackagePage && askAIButtonVariant !== 'config' && renderAskAIButton()}
        </div>
      </div>
      {platforms && <PagePlatformTags platforms={platforms} />}
      {packageName && (
        <div className="flex flex-wrap items-center gap-3 border-b-0.5 border-default py-2 empty:hidden">
          {isSdkPackagePage && (
            <>
              {renderAskAIButton()}
              <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
            </>
          )}
          <PagePackageVersion
            packageName={packageName}
            platforms={platforms}
            testRequire={testRequire}
          />
        </div>
      )}
    </div>
  );
}
