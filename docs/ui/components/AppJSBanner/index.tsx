import { Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import isBefore from 'date-fns/isBefore';
import { useRouter } from 'next/compat/router';
import React from 'react';

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
    <div className="relative flex justify-between items-center bg-appjs py-4 px-6 rounded-md overflow-hidden gap-3 shadow-xs my-6 flex-wrap bg-cover bg-left bg-no-repeat">
      <div>
        <HEADLINE className="!text-palette-white mb-1">App.js Conf 2024</HEADLINE>
        <CALLOUT className="!text-[#CCD3FF]">
          An Expo &amp; React Native conference in Europe is back, May 22-24 in Kraków, Poland!
        </CALLOUT>
      </div>
      <Button
        size="xs"
        href="https://appjs.co"
        openInNewTab
        className="gap-1.5 border-palette-white bg-palette-white text-[#03c] hocus:border-[lavender] hocus:bg-[lavender]"
        rightSlot={<ArrowUpRightIcon className="icon-sm text-[#03C] opacity-75" />}>
        Learn more
      </Button>
    </div>
  );
}
