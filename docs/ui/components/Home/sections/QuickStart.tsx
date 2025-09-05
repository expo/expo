import { mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';
import { Rocket02Icon } from '@expo/styleguide-icons/outline/Rocket02Icon';

import { GridContainer, GridCell, HomeButton } from '~/ui/components/Home/components';
import { QuickStartIcon, DevicesImage } from '~/ui/components/Home/resources';
import { Terminal } from '~/ui/components/Snippet';
import { H1, CALLOUT, A, P } from '~/ui/components/Text';

export function QuickStart() {
  return (
    <>
      <H1 className="mt-1 border-0 pb-0 !font-extrabold">
        Create amazing apps that run everywhere
      </H1>
      <P className="mb-2 text-secondary">
        Build one JavaScript/TypeScript project that runs natively on all your users' devices.
      </P>
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'min-h-[192px] bg-element !bg-cell-quickstart-pattern bg-blend-multiply'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-subtle from-15% to-[#21262d00]',
              'dark:from-[#181a1b]'
            )}
          />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="font-bold heading-xl">
              <QuickStartIcon /> Quick Start
            </h2>
            <div>
              <Terminal
                cmd={['$ npx create-expo-app@latest']}
                className="asset-shadow rounded-md"
              />
              <CALLOUT theme="secondary">
                Then continue{' '}
                <A href="/get-started/set-up-your-environment">setting up your environment</A>.
              </CALLOUT>
            </div>
          </div>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'relative z-0 min-h-[192px] border-palette-blue6 bg-palette-blue4 !bg-cell-tutorial-pattern bg-blend-multiply',
            'dark:bg-palette-blue3 dark:bg-blend-color-burn'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-palette-blue3 from-15% to-[#201d5200]',
              'dark:from-palette-blue3 dark:to-transparent'
            )}
          />
          <DevicesImage />
          <h2 className="relative z-10 max-w-[24ch] font-bold text-palette-blue12 heading-xl">
            Create a universal Android, iOS, and web app
          </h2>
          <HomeButton
            className="hocus:bg-button-primary"
            href="/tutorial/introduction/"
            rightSlot={<ArrowRightIcon className="icon-md" />}>
            Start Tutorial
          </HomeButton>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'min-h-[192px] bg-gradient-to-br from-palette-gray10 from-15% to-[#1a1a1a]',
            'border border-palette-gray11 selection:bg-palette-gray8',
            'dark:border-palette-gray7 dark:from-palette-gray3 dark:to-[#0a0a0a]'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-br from-transparent to-transparent'
            )}
          />
          <Rocket02Icon className="absolute -bottom-16 -right-10 size-72 text-palette-white opacity-5" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 !font-bold !text-palette-white heading-lg">
              <Rocket02Icon className="icon-lg text-palette-white" /> Launch to App Store
            </h2>
            <div>
              <P className="mb-3 !text-xs leading-relaxed !text-palette-gray7 dark:!text-palette-gray11">
                Ship apps with zero config or no prior experience. Launch easily guides you through
                the technical stuff, directly from GitHub.
              </P>
              <HomeButton
                className="!relative !bottom-auto border-2 border-palette-white bg-palette-white font-semibold text-palette-black shadow-md hocus:border-palette-gray1 hocus:bg-palette-gray1 hocus:text-palette-black dark:hocus:border-palette-gray11 dark:hocus:bg-palette-gray11 dark:hocus:text-palette-black"
                href="https://launch.expo.dev/"
                target="_blank"
                rightSlot={<ArrowUpRightIcon className="icon-md text-palette-black" />}>
                Try Launch
              </HomeButton>
            </div>
          </div>
        </GridCell>
      </GridContainer>
    </>
  );
}
