import { mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons';

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
            'max-md-gutters:min-h-[200px]'
          )}>
          <div className="inset-0 size-full absolute rounded-lg bg-cell-tutorial-fade" />
          <DevicesImage />
          <RawH2 className="!text-palette-blue12 relative z-10">
            Create a universal Android, iOS, and web app
          </RawH2>
          <HomeButton
            className="hocus:bg-button-primary hocus:opacity-80"
            href="/tutorial/introduction/"
            rightSlot={<ArrowRightIcon className="icon-md" />}>
            Start Tutorial
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
