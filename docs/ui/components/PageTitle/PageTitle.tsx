import { Button, mergeClasses } from '@expo/styleguide';
import { BuildIcon, GithubIcon } from '@expo/styleguide-icons';

import { CALLOUT, H1 } from '~/ui/components/Text';

type Props = {
  title?: string;
  packageName?: string;
  sourceCodeUrl?: string;
  iconUrl?: string;
};

export const PageTitle = ({ title, packageName, iconUrl, sourceCodeUrl }: Props) => (
  <div className="flex my-2 items-center justify-between max-xl-gutters:flex-col max-xl-gutters:items-start">
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
    {packageName && (
      <span className="flex gap-1 max-lg-gutters:mt-3 max-lg-gutters:mb-1">
        {sourceCodeUrl && (
          <Button
            theme="quaternary"
            className="min-h-[48px] min-w-[60px] px-2 justify-center max-lg-gutters:min-h-[unset]"
            openInNewTab
            href={sourceCodeUrl}
            title={`View source code of ${packageName} on GitHub`}>
            <div
              className={mergeClasses(
                'flex flex-col items-center',
                'max-lg-gutters:flex-row max-lg-gutters:gap-1.5'
              )}>
              <GithubIcon className="text-icon-secondary" />
              <CALLOUT crawlable={false} theme="secondary">
                GitHub
              </CALLOUT>
            </div>
          </Button>
        )}
        <Button
          theme="quaternary"
          openInNewTab
          className="min-h-[48px] min-w-[60px] px-2 justify-center max-lg-gutters:min-h-[unset]"
          href={`https://www.npmjs.com/package/${packageName}`}
          title="View package in npm Registry">
          <div
            className={mergeClasses(
              'flex flex-col items-center',
              'max-lg-gutters:flex-row max-lg-gutters:gap-1.5'
            )}>
            <BuildIcon className="text-icon-secondary" />
            <CALLOUT crawlable={false} theme="secondary">
              npm
            </CALLOUT>
          </div>
        </Button>
      </span>
    )}
  </div>
);
