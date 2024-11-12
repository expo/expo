import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { isBefore } from 'date-fns/isBefore';
import { useEffect, useState } from 'react';

import { ConfettiPopper } from './ConfettiPopper';

import { useLocalStorage } from '~/common/useLocalStorage';
import { CALLOUT, HEADLINE } from '~/ui/components/Text';

type Props = {
  currentDateAsString?: string;
};

export function LaunchPartyBanner({ currentDateAsString }: Props) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLaunchPartyBannerVisible, setLaunchPartyBannerVisible] = useLocalStorage<boolean>({
    name: '2024-launch-party-banner',
    defaultValue: true,
  });

  const appJSConfEndDate = new Date('2024-11-22');
  const currentDate = currentDateAsString ? new Date(currentDateAsString) : new Date();
  const showLaunchPartyShoutout = isBefore(currentDate, appJSConfEndDate);

  useEffect(function didMount() {
    setIsLoaded(true);
  }, []);

  if (!isLaunchPartyBannerVisible || !showLaunchPartyShoutout || !isLoaded) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'asset-shadow relative mb-6 flex justify-between overflow-hidden rounded-lg',
        'border-2 border-palette-black bg-palette-white dark:border-palette-white dark:bg-palette-black',
        'max-md-gutters:flex-col max-md-gutters:items-start max-md-gutters:gap-2 max-md-gutters:bg-launch-party-banner-mobile'
      )}>
      <div
        className={mergeClasses(
          'absolute bottom-0 hidden h-[60px] w-full bg-launch-party-banner bg-left-bottom',
          'max-md-gutters:flex'
        )}
      />
      <div className="flex items-center gap-4 p-5">
        <div
          className={mergeClasses(
            'relative z-10 flex size-[44px] shrink-0 select-none justify-center rounded-md border-2 border-default bg-hover text-[24px] leading-[42px] shadow-xs',
            'max-sm-gutters:hidden'
          )}>
          <ConfettiPopper />
        </div>
        <div className="relative grid grid-cols-1">
          <HEADLINE className="font-semibold">Expo Launch Party 2024</HEADLINE>
          <CALLOUT className="text-secondary">
            Sign up for the Launch Party and join us on Nov 18-22! 🥳
          </CALLOUT>
        </div>
      </div>
      <div
        className={mergeClasses(
          'flex min-w-[39.5%] items-center justify-end gap-3 bg-launch-party-banner bg-left bg-no-repeat pr-5 z-10 shrink-0',
          'max-md-gutters:mb-4 max-md-gutters:h-[unset] max-md-gutters:min-w-[unset] max-md-gutters:bg-none max-md-gutters:px-5'
        )}>
        <Button
          size="xs"
          href="https://expo.dev/launch-party"
          openInNewTab
          rightSlot={<ArrowUpRightIcon className="icon-xs text-palette-black opacity-75" />}
          className={mergeClasses(
            'gap-1.5 border-2 border-palette-white bg-launch-party-yellow text-palette-black',
            'hocus:bg-launch-party-yellow hocus:bg-opacity-80 hocus:backdrop-blur-sm'
          )}>
          Learn More
        </Button>
        <Button
          size="xs"
          onClick={() => {
            setLaunchPartyBannerVisible(false);
          }}
          className={mergeClasses(
            'border-2 border-palette-white bg-launch-party-red text-palette-white',
            'hocus:bg-launch-party-red hocus:bg-opacity-80 hocus:backdrop-blur-sm'
          )}
          leftSlot={<XIcon />}
        />
      </div>
    </div>
  );
}
