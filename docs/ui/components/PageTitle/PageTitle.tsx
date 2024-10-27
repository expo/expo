import { mergeClasses } from '@expo/styleguide';

import { PageTitleButtons } from './PageTitleButtons';

import { H1, P } from '~/ui/components/Text';

type Props = {
  title?: string;
  description?: string;
  packageName?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
};

export const PageTitle = ({ title, description, packageName, iconUrl, sourceCodeUrl }: Props) => {
  return (
    <>
      <div
        className={mergeClasses(
          'flex my-2 items-start justify-between gap-4',
          'max-xl-gutters:flex-col max-xl-gutters:items-start'
        )}>
        <H1 className="!my-0">
          {iconUrl && (
            <img
              src={iconUrl}
              className="float-left mr-3.5 relative -top-0.5 size-[42px]"
              alt={`Expo ${title} icon`}
            />
          )}
          {packageName && packageName.startsWith('expo-') && 'Expo '}
          {title}
        </H1>
        <span className="flex gap-1 max-xl-gutters:hidden">
          <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
        </span>
      </div>
      {description && (
        <P theme="secondary" data-description="true">
          {description}
        </P>
      )}
      <span className="hidden gap-1 mt-3 mb-1 max-xl-gutters:flex">
        <PageTitleButtons packageName={packageName} sourceCodeUrl={sourceCodeUrl} />
      </span>
    </>
  );
};
