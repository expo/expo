import { RouterLogo, mergeClasses } from '@expo/styleguide';
import { AppleAppStoreIcon } from '@expo/styleguide-icons/custom/AppleAppStoreIcon';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { Cloud01DuotoneIcon } from '@expo/styleguide-icons/duotone/Cloud01DuotoneIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';

import { GridContainer, GridCell, HomeButton } from '~/ui/components/Home/components';
import { QuickStartIcon, DevicesImage } from '~/ui/components/Home/resources';
import { Terminal } from '~/ui/components/Snippet';
import { H1, RawH2, CALLOUT, A, P } from '~/ui/components/Text';

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
              <Terminal cmd={['$ npx create-expo-app@latest']} />
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
            'dark:bg-palette-blue3'
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
            'min-h-[192px] border-palette-purple6 bg-palette-purple4',
            'selection:bg-palette-purple6',
            'dark:border-palette-purple7 dark:bg-palette-purple4'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-palette-purple3 from-15% to-transparent',
              'dark:from-palette-purple3 dark:to-transparent'
            )}
          />
          <AppleAppStoreIcon className="absolute -bottom-16 -right-10 size-72 text-palette-purple10 opacity-10" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 !font-bold !text-palette-purple10 heading-lg">
              <AppleAppStoreIcon className="icon-lg text-palette-purple10" /> Deploy to TestFlight
            </h2>
            <div>
              <Terminal cmd={['$ npx testflight']} />
              <CALLOUT theme="secondary">
                This is an iOS-only command that will upload your app to TestFlight.
              </CALLOUT>
            </div>
          </div>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'min-h-[192px] border-palette-green6 bg-[#f0f9f0]',
            'selection:bg-palette-green5',
            'dark:border-palette-green7 dark:bg-[#1d392c]'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-[#e8f5e8] from-15% to-transparent',
              'dark:from-[#1d392c] dark:to-transparent'
            )}
          />
          <Cloud01DuotoneIcon className="absolute -bottom-20 -right-8 size-80 text-[#1e8a5f] opacity-10 dark:text-[#4eca8c]" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 !font-bold !text-[#1e8a5f] heading-lg dark:!text-[#4eca8c]">
              <Cloud01DuotoneIcon className="icon-lg text-[#1e8a5f] dark:text-[#4eca8c]" /> Deploy
              your web app
            </h2>
            <div>
              <Terminal cmd={['$ npx eas-cli deploy']} />
              <CALLOUT theme="secondary">
                For prerequisites and complete instructions, see{' '}
                <A href="/deploy/web/#export-your-web-project/">our guide</A>.
              </CALLOUT>
            </div>
          </div>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'relative z-0 min-h-[158px] border-palette-pink6 bg-palette-pink3 dark:bg-palette-pink3',
            'selection:bg-palette-pink5',
            'max-md-gutters:min-h-[200px]'
          )}>
          <RouterLogo
            className={mergeClasses(
              'absolute -bottom-20 -left-24 size-[340px] rotate-[20deg] opacity-[0.12]',
              'stroke-palette-pink7 stroke-[0.01rem] text-palette-pink7'
            )}
          />
          <RouterLogo
            className={mergeClasses(
              'absolute bottom-6 right-6 size-[72px] rounded-xl border-[6px] p-3',
              'border-palette-pink5 bg-palette-pink4 stroke-palette-pink8 stroke-[0.01rem] text-palette-pink8'
            )}
          />
          <RawH2 className="relative z-10 max-w-[32ch] !text-lg !text-palette-pink11">
            Discover the benefits of file-based routing with Expo Router
          </RawH2>
          <HomeButton
            className="border-palette-pink10 bg-palette-pink10 hocus:bg-palette-pink9 dark:text-palette-pink2"
            href="/router/introduction/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-pink2" />}>
            Learn more
          </HomeButton>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'relative z-0 min-h-[158px] border-palette-orange6 bg-palette-orange3',
            'selection:bg-palette-orange5',
            'max-md-gutters:min-h-[200px]'
          )}>
          <PlanEnterpriseIcon
            className={mergeClasses(
              'absolute -bottom-12 -left-20 size-[350px] rotate-[40deg] opacity-[0.12]',
              'text-palette-orange7'
            )}
          />
          <PlanEnterpriseIcon
            className={mergeClasses(
              'absolute bottom-6 right-6 size-[72px] rounded-xl border-[6px] p-2',
              'border-palette-orange5 bg-palette-orange4 text-palette-orange8'
            )}
          />
          <RawH2 className="relative z-10 max-w-[22ch] !text-lg !text-palette-orange11">
            Speed up your development with Expo Application Services
          </RawH2>
          <HomeButton
            className="border-palette-orange10 bg-palette-orange10 hocus:bg-palette-orange9 dark:text-palette-orange2"
            href="/tutorial/eas/introduction/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-orange2" />}>
            <span className="max-sm-gutters:hidden">Start&nbsp;</span>EAS Tutorial
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
