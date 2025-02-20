import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { XIcon } from '@expo/styleguide-icons/outline/XIcon';
import { isBefore } from 'date-fns/isBefore';
import { useRouter } from 'next/compat/router';

import { useLocalStorage } from '~/common/useLocalStorage';
import { CALLOUT, HEADLINE } from '~/ui/components/Text';

import { AppJSIcon } from './AppJSIcon';

export function AppJSBanner() {
  const [lastDismissDate, setLastDismissDate] = useLocalStorage<string | null>({
    name: 'appjs-cfp-shoutout',
    defaultValue: null,
  });

  const router = useRouter();

  const appJSCFPEndDate = new Date('2025-02-23');
  const showAppJSConfShoutout = isBefore(new Date(), appJSCFPEndDate);
  const isHomePage = router?.pathname === '/';

  if (!showAppJSConfShoutout || !isHomePage || lastDismissDate) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'relative mb-4 mt-6 flex items-center justify-between gap-3 overflow-hidden rounded-lg px-6 py-4',
        'border border-[#494CFC] bg-[#F8EEED] dark:bg-[#3133b0]',
        'max-md-gutters:flex-wrap'
      )}>
      <div className="flex items-center gap-4">
        <div className="relative z-10 p-2 max-sm-gutters:hidden">
          <div className="asset-sm-shadow absolute inset-0 rounded-md bg-[#494CFC] dark:bg-[#494CFC]" />
          <AppJSIcon className="icon-lg relative z-10 text-palette-white" />
        </div>
        <div className="relative grid grid-cols-1 gap-0.5">
          <HEADLINE className="text-[#494CFC] dark:text-[#F8EEED]">App.js Conf 2025 CFP</HEADLINE>
          <CALLOUT className="text-[#494CFC] dark:text-[#abacf8]">
            Calls for papers are now open! Submit your talk by February 23, 2025.
          </CALLOUT>
        </div>
      </div>
      <div className="z-10 flex items-center gap-3">
        <Button
          size="xs"
          href="https://docs.google.com/forms/d/e/1FAIpQLSeKSqxwrTdJJavOFgK-UA25K-hJPmZ5wnZDY7UUo9ULDuckkA/viewform"
          openInNewTab
          rightSlot={<ArrowUpRightIcon className="icon-xs text-palette-white opacity-75" />}
          className={mergeClasses(
            'asset-sm-shadow gap-1.5 border-[#494CFC] bg-[#494CFC] text-palette-white shadow-none',
            'hocus:bg-[#7189ff] dark:hocus:bg-[#3133b0]'
          )}>
          Learn More
        </Button>
        <Button
          size="xs"
          onClick={() => {
            setLastDismissDate(new Date().toDateString());
          }}
          theme="tertiary"
          className={mergeClasses(
            'hocus:asset-sm-shadow hocus:bg-[#f8d9d6]',
            'dark:hocus:border dark:hocus:border-[#494CFC] dark:hocus:bg-transparent'
          )}
          leftSlot={<XIcon className="text-[#494CFC] dark:text-[#F8EEED]" />}
        />
      </div>
    </div>
  );
}
