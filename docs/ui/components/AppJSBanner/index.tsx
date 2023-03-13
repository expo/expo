import { css } from '@emotion/react';
import { Button, theme, shadows } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons';
import { borderRadius, breakpoints, spacing, iconSize } from '@expo/styleguide-base';
import isBefore from 'date-fns/isBefore';
import { useRouter } from 'next/router';
import React from 'react';

import { Background } from './Background';

import { CALLOUT, HEADLINE } from '~/ui/components/Text';

export function AppJSBanner() {
  const router = useRouter();
  const appJSConfEndDate = new Date('2023-05-10');
  const showAppJSConfShoutout = isBefore(new Date(), appJSConfEndDate);
  const isHomePage = router.pathname === '/';

  if (!showAppJSConfShoutout || !isHomePage) {
    return null;
  }

  return (
    <div className='relative flex justify-between items-center bg-[#0019C1] py-4 px-6 rounded-md overflow-hidden gap-3 shadow-xs my-6 flex-wrap'>
      <div className='absolute -top-1 -left-1'>
        <Background />
      </div>
      <div>
        <HEADLINE css={headlineStyle}>App.js Conf 2023</HEADLINE>
        <CALLOUT css={descriptionStyle}>
          An Expo &amp; React Native conference in Europe is back, May 10-12 in Kraków, Poland!
        </CALLOUT>
      </div>
      <Button
        size='xs'
        href='https://appjs.co'
        openInNewTab
        className='bg-palette-white text-[#0019C1] border-none'
        rightSlot={<ArrowUpRightIcon className='icon-sm text-[#0019C1]' />}>
        Learn more
      </Button>
    </div>
  );
}

const headlineStyle = css({
  position: 'relative',
  color: theme.palette.white,
  marginBottom: spacing[1],
});

const descriptionStyle = css({
  position: 'relative',
  color: '#CCD3FF',
});
