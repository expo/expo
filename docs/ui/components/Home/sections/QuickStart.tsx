import { RouterLogo, mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon, PlanEnterpriseIcon } from '@expo/styleguide-icons';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { QuickStartIcon, DevicesImage } from '~/ui/components/Home/resources';
import { Terminal } from '~/ui/components/Snippet';
import { H1, RawH2, CALLOUT, A } from '~/ui/components/Text';

export function QuickStart() {
  return (
    <>
      <H1 className="mt-2 pb-0 border-0 !font-extrabold">
        Create amazing apps that run everywhere
      </H1>
      <HeaderDescription>
        Build one JavaScript/TypeScript project that runs natively on all your users' devices.
      </HeaderDescription>
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'bg-subtle min-h-[250px] !bg-cell-quickstart-pattern bg-blend-multiply',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div className="inset-0 size-full absolute rounded-lg bg-cell-quickstart-fade" />
          <div className="flex flex-col gap-4 relative z-10">
            <RawH2>
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
            'bg-palette-blue4 border-palette-blue7 relative z-0 min-h-[250px] !bg-cell-tutorial-pattern bg-blend-multiply',
            'dark:bg-palette-blue3',
            'max-md-gutters:min-h-[200px]'
          )}>
          <div className="inset-0 size-full absolute rounded-lg bg-cell-tutorial-fade" />
          <DevicesImage />
          <RawH2 className="!text-palette-blue12 relative z-10">
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
            'bg-palette-pink3 border-palette-pink7 relative z-0 min-h-[164px] dark:bg-palette-pink3',
            'max-md-gutters:min-h-[200px]'
          )}>
          <RouterLogo
            className={mergeClasses(
              'size-20 absolute right-7 bottom-7 border-[5px] rounded-xl p-3',
              'stroke-[0.01rem] stroke-palette-pink8 text-palette-pink8 bg-palette-pink4 border-palette-pink5'
            )}
          />
          <RawH2 className="!text-palette-pink11 relative z-10 !text-lg">
            Discover the benefits of file-based routing with Expo Router
          </RawH2>
          <HomeButton
            className="bg-palette-pink10 border-palette-pink10 dark:text-palette-pink2 hocus:bg-palette-pink9"
            href="/router/introduction/"
            size="sm"
            rightSlot={<ArrowRightIcon className="icon-md dark:text-palette-pink2" />}>
            Discover more
          </HomeButton>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'bg-palette-purple3 border-palette-purple7 relative z-0 min-h-[172px]',
            'max-md-gutters:min-h-[200px]'
          )}>
          <PlanEnterpriseIcon
            className={mergeClasses(
              'size-20 absolute right-7 bottom-7 border-[5px] rounded-xl p-2',
              'text-palette-purple8 bg-palette-purple4 border-palette-purple5'
            )}
          />
          <RawH2 className="!text-palette-purple11 relative z-10 !text-lg">
            Speed up your development with Expo Application Services
          </RawH2>
          <HomeButton
            className="bg-palette-purple10 border-palette-purple10 dark:text-palette-purple2 hocus:bg-palette-purple9"
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
