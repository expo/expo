import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { isBefore } from 'date-fns/isBefore';
import { useEffect, useState } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';

import { AppJSIcon } from './AppJSIcon';

export function AppJSBanner() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAppJSBannerVisible, setIsAppJSBannerVisible] = useLocalStorage<boolean>({
    name: '2025-appjs-banner',
    defaultValue: true,
  });

  const appJSConfEndDate = new Date('2025-05-28');
  const showAppJSConfShoutout = isBefore(new Date(), appJSConfEndDate);

  useEffect(function didMount() {
    setIsLoaded(true);
  }, []);

  if (!isAppJSBannerVisible || !showAppJSConfShoutout || !isLoaded) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'relative mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg px-6 py-4',
        'bg-[#eef0ff] dark:bg-[#494CFC22]',
        'border border-[#494CFC] dark:border-[#3133b0]',
        'max-md-gutters:flex-wrap'
      )}>
      <div className="flex items-center gap-4">
        <div className="relative z-10 p-2 max-sm-gutters:hidden">
          <div className="asset-sm-shadow absolute inset-0 rounded-md bg-[#494CFC]" />
          <AppJSIcon className="icon-lg relative z-10 text-palette-white" />
        </div>
        <div className="relative grid grid-cols-1">
          <p className="text-base font-medium text-[#494CFC] dark:text-[#a0b9ff]">
            App.js Conf 2025
          </p>
          <p className="text-sm text-[#494CFC] dark:text-[#a0b9ff]">
            Join us on the biggest React Native & Expo-focused conference.
          </p>
        </div>
      </div>
      <div className="z-10 flex items-center gap-3">
        <Button
          size="xs"
          href="https://appjs.co/"
          openInNewTab
          rightSlot={<ArrowUpRightIcon className="icon-xs text-palette-white opacity-75" />}
          className={mergeClasses(
            'gap-1.5 border-[#494CFC] bg-[#494CFC] text-palette-white shadow-none',
            'dark:hocus:border-[#23257b] dark:hocus:bg-[#23257b]',
            'hocus:border-[#7189ff] hocus:bg-[#7189ff]'
          )}>
          Learn More
        </Button>
        <Button
          size="xs"
          theme="tertiary"
          onClick={() => {
            setIsAppJSBannerVisible(false);
          }}
          className="bg-transparent text-palette-white shadow-none hocus:bg-[#ccd8ff] dark:hocus:bg-[#23257b]"
          leftSlot={<XIcon className="text-[#494CFC]" />}
        />
      </div>
    </div>
  );
}
