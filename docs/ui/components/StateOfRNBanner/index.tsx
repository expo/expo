import { mergeClasses, Button } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { isBefore } from 'date-fns/isBefore';
import { useRouter } from 'next/compat/router';

import { CALLOUT, HEADLINE } from '~/ui/components/Text';

import { ReactLogo } from './ReactLogo';

export function StateOfRNBanner() {
  const router = useRouter();
  const stateOfRNEndDate = new Date('2025-01-08');
  const showShoutout = isBefore(new Date(), stateOfRNEndDate);
  const isHomePage = router?.pathname === '/';

  if (!showShoutout || !isHomePage) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'relative mb-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg px-6 py-4',
        'border-2 border-[#001a72] bg-[#b1dfd0]',
        'dark:border-[#b1dfd0] dark:bg-[#001a72]',
        'max-md-gutters:flex-wrap'
      )}>
      <div className="flex items-center gap-4">
        <div className="relative z-10 p-2 max-sm-gutters:hidden">
          <div className="asset-sm-shadow absolute inset-0 rounded-md bg-[#001a72] dark:bg-[#b1dfd0]" />
          <ReactLogo className="icon-lg relative z-10 text-palette-white dark:text-[#001a72]" />
        </div>
        <div className="relative grid grid-cols-1 gap-1">
          <HEADLINE className="text-[#001a72] dark:text-[#b1dfd0]">
            State of React Native 2024
          </HEADLINE>
          <CALLOUT className="text-[#001a72] dark:text-[#b1dfd0]">
            Have a few minutes and want to shape the future of React Native?
          </CALLOUT>
        </div>
      </div>
      <div className="z-10 flex items-center gap-3">
        <Button
          size="xs"
          href="https://survey.stateofreactnative.com/"
          openInNewTab
          rightSlot={
            <ArrowUpRightIcon className="icon-xs text-palette-white opacity-75 dark:text-[#001a72]" />
          }
          className={mergeClasses(
            'gap-1.5 border-[#001a72] bg-[#001a72] text-palette-white',
            'dark:border-[#b1dfd0] dark:bg-[#b1dfd0] dark:text-[#001a72]',
            'hocus:border-[#0026a3] hocus:bg-[#0026a3]',
            'dark:hocus:border-[#8bd0b9] dark:hocus:bg-[#8bd0b9]'
          )}>
          Fill out the survey now!
        </Button>
      </div>
    </div>
  );
}
