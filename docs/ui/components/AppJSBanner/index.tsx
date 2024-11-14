import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { isBefore } from 'date-fns/isBefore';
import { useRouter } from 'next/compat/router';

import { AppJSIcon } from './AppJSIcon';

import { CALLOUT, HEADLINE } from '~/ui/components/Text';

export function AppJSBanner() {
  const router = useRouter();
  const appJSConfEndDate = new Date('2024-05-24');
  const showAppJSConfShoutout = isBefore(new Date(), appJSConfEndDate);
  const isHomePage = router?.pathname === '/';

  if (!showAppJSConfShoutout || !isHomePage) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'relative mb-4 mt-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg px-6 py-4',
        'bg-appjs bg-cover bg-left bg-no-repeat',
        'border border-[#03c] dark:border-[#1e51e7]',
        'max-md-gutters:flex-wrap'
      )}>
      <div className="flex items-center gap-4">
        <div className="relative z-10 p-2 max-sm-gutters:hidden">
          <div className="asset-sm-shadow absolute inset-0 rounded-md bg-[#1e51e7]" />
          <AppJSIcon className="icon-lg relative z-10 text-palette-white" />
        </div>
        <div className="relative grid grid-cols-1 gap-0.5">
          <HEADLINE className="!text-palette-white">App.js Conf 2024</HEADLINE>
          <CALLOUT className="!text-[#CCD3FF]">
            The Expo &amp; React Native conference in Europe is back, May 22-24 in Kraków, Poland!
          </CALLOUT>
        </div>
      </div>
      <div className="z-10 flex items-center gap-3">
        <Button
          size="xs"
          href="https://appjs.co"
          openInNewTab
          rightSlot={<ArrowUpRightIcon className="icon-xs text-palette-white opacity-75" />}
          className={mergeClasses(
            'asset-sm-shadow gap-1.5 border-[#5d82ff] bg-[#1e51e7] text-palette-white shadow-none',
            'hocus:bg-[#2b5ef3]'
          )}>
          Learn More
        </Button>
      </div>
    </div>
  );
}
