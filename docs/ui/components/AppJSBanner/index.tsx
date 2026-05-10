import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { isBefore } from 'date-fns/isBefore';
import { useEffect, useState } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';

import { AppJSIcon } from './AppJSIcon';

export function AppJSBanner() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAppJSBannerVisible, setIsAppJSBannerVisible] = useLocalStorage<boolean>({
    name: '2026-appjs-banner',
    defaultValue: true,
  });

  const appJSConfEndDate = new Date('2026-05-29');
  const showAppJSConfShoutout = isBefore(new Date(), appJSConfEndDate);

  useEffect(function didMount() {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && isAppJSBannerVisible && showAppJSConfShoutout) {
      const id = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isLoaded, isAppJSBannerVisible, showAppJSConfShoutout]);

  if (!isLoaded || !isAppJSBannerVisible || !showAppJSConfShoutout) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'grid transition-[grid-template-rows,opacity] duration-[600ms] ease-out motion-reduce:transition-none',
        isOpen ? 'grid-rows-[1fr] opacity-100 delay-500' : 'grid-rows-[0fr] opacity-0'
      )}
      onTransitionEnd={event => {
        if (event.propertyName === 'grid-template-rows' && !isOpen) {
          setIsAppJSBannerVisible(false);
        }
      }}>
      <div className="min-h-0 overflow-hidden">
        <div
          className={mergeClasses(
            'relative mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg px-6 py-4',
            'bg-[#eef0ff] dark:bg-[#494CFC22]',
            'border border-[#494CFC] dark:border-[#3133b0]',
            'max-md-gutters:flex-wrap'
          )}>
          <div className="flex items-center gap-4">
            <div className="max-sm-gutters:hidden relative z-10 p-2">
              <div className="asset-sm-shadow absolute inset-0 rounded-md bg-[#494CFC]" />
              <AppJSIcon className="icon-lg text-palette-white relative z-10" />
            </div>
            <div className="relative grid grid-cols-1">
              <p className="text-base font-medium text-[#494CFC] dark:text-[#a0b9ff]">
                App.js Conf 2026
              </p>
              <p className="text-sm text-[#494CFC] dark:text-[#a0b9ff]">
                Join us at the biggest React Native & Expo-focused conference.
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
                'text-palette-white gap-1.5 border-[#494CFC] bg-[#494CFC] shadow-none',
                'dark:hocus:border-[#23257b] dark:hocus:bg-[#23257b]',
                'hocus:border-[#7189ff] hocus:bg-[#7189ff]'
              )}>
              Learn More
            </Button>
            <Button
              size="xs"
              theme="tertiary"
              aria-label="Dismiss banner"
              onClick={() => {
                setIsOpen(false);
              }}
              className="text-palette-white hocus:bg-[#ccd8ff] dark:hocus:bg-[#23257b] bg-transparent shadow-none"
              leftSlot={<XIcon className="text-[#494CFC]" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
