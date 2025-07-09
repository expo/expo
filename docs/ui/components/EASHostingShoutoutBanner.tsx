import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { Cloud01Icon } from '@expo/styleguide-icons/outline/Cloud01Icon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { useEffect, useState } from 'react';

import { useLocalStorage } from '~/common/useLocalStorage';

export function EASHostingShoutoutBanner() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastDismissDate, setLastDismissDate] = useLocalStorage<string | null>({
    name: 'eas-hosting-shoutout',
    defaultValue: null,
  });

  useEffect(function didMount() {
    setIsLoaded(true);
  }, []);

  if (lastDismissDate || !isLoaded) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'relative mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-success bg-palette-green2 px-6 py-4 shadow-xs',
        'max-md-gutters:flex-wrap'
      )}>
      <svg
        className="absolute left-[37.5%] -mt-1 rotate-45 opacity-35 dark:opacity-25"
        fill="none"
        height="675"
        viewBox="0 0 1200 675"
        width="1200"
        xmlns="http://www.w3.org/2000/svg">
        <linearGradient
          id="a"
          gradientUnits="userSpaceOnUse"
          x1="600"
          x2="600"
          y1="215.98"
          y2="664.195">
          <stop offset="0" stopColor="#03c369" stopOpacity="0" />
          <stop offset="1" stopColor="#03c369" />
        </linearGradient>
        <linearGradient
          id="b"
          gradientUnits="userSpaceOnUse"
          x1="619.932"
          x2="626.383"
          y1="256.264"
          y2="571.791">
          <stop offset="0" stopColor="#03c369" stopOpacity="0" />
          <stop offset="1" stopColor="#03c369" />
        </linearGradient>
        <path
          d="m687.102 676.386-86.537-651.6533m0 0 242.567 651.6533m-242.567-651.6533 392.04 651.6533m-392.04-651.6533 550.695 651.6533m-550.695-651.6533 713.275 651.6533m-713.275-651.6533 875.865 651.6533h148.16zm-87.667 651.6533 86.537-651.6533m0 0-242.567 651.6533m242.567-651.6533-392.04 651.6533m392.04-651.6533-550.6923 651.6533m550.6923-651.6533-713.278 651.6533m713.278-651.6533-875.863 651.6533h-148.163z"
          stroke="url(#a)"
        />
        <path
          d="m1.58728 571.791h1198.58272m-1198.58272-98.111h1198.58272m-1198.58272-65.407h1198.58272m-1134.0979-44.15h1068.2979m-1026.572-26.623h983.912m-950.51-21.263h917.31m-885.635-20.241h854.115m-829.343-15.742h804.213m-784.01-12.744h764.596m-747.235-11.246h729.282"
          stroke="url(#b)"
        />
      </svg>
      <div className="flex items-center gap-4">
        <div className="relative z-10 p-2 max-sm-gutters:hidden">
          <div
            className={mergeClasses(
              'asset-sm-shadow absolute inset-0 rounded-md bg-palette-green10',
              'dark:bg-palette-green6'
            )}
          />
          <Cloud01Icon className="icon-lg relative z-10 text-palette-white" />
        </div>
        <div className="relative grid grid-cols-1">
          <p className="text-base font-medium text-success">EAS Hosting</p>
          <p className="text-sm text-success">
            Try the first end-to-end deployment solution for universal app development.
          </p>
        </div>
      </div>
      <div className="z-10 flex items-center gap-3">
        <Button
          size="xs"
          openInNewTab
          href="https://expo.dev/blog/expo-announces-eas-hosting-service"
          theme="secondary"
          rightSlot={<ArrowUpRightIcon className="icon-xs text-icon-success" />}
          className={mergeClasses(
            'gap-1.5 border-success text-icon-success hocus:bg-palette-green2',
            'dark:border-palette-green8 dark:bg-palette-green4 dark:text-default dark:hocus:bg-palette-green5'
          )}>
          Learn More
        </Button>
        <Button
          size="xs"
          onClick={() => {
            setLastDismissDate(new Date().toDateString());
          }}
          theme="tertiary"
          className="hocus:bg-palette-green4"
          leftSlot={<XIcon className="text-icon-success" />}
        />
      </div>
    </div>
  );
}
