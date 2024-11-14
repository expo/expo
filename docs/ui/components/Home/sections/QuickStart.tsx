import { RouterLogo, mergeClasses } from '@expo/styleguide';
import { PlanEnterpriseIcon } from '@expo/styleguide-icons/custom/PlanEnterpriseIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { QuickStartIcon, DevicesImage } from '~/ui/components/Home/resources';
import { Terminal } from '~/ui/components/Snippet';
import { H1, RawH2, CALLOUT, A } from '~/ui/components/Text';

export function QuickStart() {
  return (
    <>
      <H1 className="mt-2 border-0 pb-0 !font-extrabold">
        Create amazing apps that run everywhere
      </H1>
      <HeaderDescription>
        Build one JavaScript/TypeScript project that runs natively on all your users' devices.
      </HeaderDescription>
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'min-h-[250px] bg-element !bg-cell-quickstart-pattern bg-blend-multiply',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-subtle from-15% to-[#21262d00]',
              'dark:from-[#181a1b]'
            )}
          />
          <div className="relative z-10 flex flex-col gap-4">
            <RawH2 className="!font-bold">
              <QuickStartIcon /> Quick Start
            </RawH2>
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
            'relative z-0 min-h-[250px] border-palette-blue6 bg-palette-blue4 !bg-cell-tutorial-pattern bg-blend-multiply',
            'dark:bg-palette-blue3',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div
            className={mergeClasses(
              'absolute inset-0 size-full rounded-lg bg-gradient-to-b from-palette-blue3 from-15% to-[#201d5200]',
              'dark:from-palette-blue3 dark:to-transparent'
            )}
          />
          <DevicesImage />
          <RawH2 className="relative z-10 !font-bold !text-palette-blue12">
            Create a universal Android, iOS, and web app
          </RawH2>
          <HomeButton
            className="hocus:bg-button-primary"
            href="/tutorial/introduction/"
            rightSlot={<ArrowRightIcon className="icon-md" />}>
            Start Tutorial
          </HomeButton>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'relative z-0 min-h-[164px] border-palette-pink6 bg-palette-pink3 dark:bg-palette-pink3',
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
          <RawH2 className="relative z-10 !text-lg !text-palette-pink11">
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
            'relative z-0 min-h-[172px] border-palette-purple6 bg-palette-purple3',
            'selection:bg-palette-purple5',
            'max-md-gutters:min-h-[200px]'
          )}>
          <PlanEnterpriseIcon
            className={mergeClasses(
              'absolute -bottom-12 -left-20 size-[350px] rotate-[40deg] opacity-[0.12]',
              'text-palette-purple7'
            )}
          />
          <PlanEnterpriseIcon
            className={mergeClasses(
              'absolute bottom-6 right-6 size-[72px] rounded-xl border-[6px] p-2',
              'border-palette-purple5 bg-palette-purple4 text-palette-purple8'
            )}
          />
          <RawH2 className="relative z-10 !text-lg !text-palette-purple11">
            Speed up your development with Expo Application Services
          </RawH2>
          <HomeButton
            className="border-palette-purple10 bg-palette-purple10 hocus:bg-palette-purple9 dark:text-palette-purple2"
            href="/tutorial/eas/introduction/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-purple2" />}>
            <span className="max-sm-gutters:hidden">Start&nbsp;</span>EAS Tutorial
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
