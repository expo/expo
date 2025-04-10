import { mergeClasses } from '@expo/styleguide';

import { WithTestRequire } from '~/types/common';
import { H1, P } from '~/ui/components/Text';

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
} & WithTestRequire;

export function PageHeader({
  title,
  description,
  packageName,
  iconUrl,
  sourceCodeUrl,
  platforms,
  testRequire,
}: Props) {
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
        <span className="-mt-0.5 flex gap-1 max-xl-gutters:hidden">
          <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
        </span>
      </div>
      {description && (
        <P theme="secondary" data-description="true">
          {description}
        </P>
      )}
      <span className="mb-1 mt-3 hidden gap-1 max-xl-gutters:flex">
        <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
      </span>
      <div
        className={mergeClasses(
          'mt-3 flex items-center justify-between',
          'max-md-gutters:flex-col-reverse max-md-gutters:items-start max-md-gutters:gap-3',
          'empty:hidden'
        )}>
        {platforms && <PagePlatformTags platforms={platforms} />}
        {packageName && <PagePackageVersion packageName={packageName} testRequire={testRequire} />}
      </div>
    </>
  );
}
