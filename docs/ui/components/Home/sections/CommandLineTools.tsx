import { mergeClasses } from '@expo/styleguide';
import { AppleAppStoreIcon } from '@expo/styleguide-icons/custom/AppleAppStoreIcon';
import { Cloud01DuotoneIcon } from '@expo/styleguide-icons/duotone/Cloud01DuotoneIcon';

import { GridContainer, GridCell, Header } from '~/ui/components/Home/components';
import { Terminal } from '~/ui/components/Snippet';
import { CALLOUT, A } from '~/ui/components/Text';

export function CommandLineTools() {
  return (
    <>
      <Header
        title="Deploy from the command line"
        description="Deploy your apps using command-line tools for iOS and web platforms."
      />
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'min-h-[192px] bg-subtle bg-gradient-to-br from-subtle from-15% to-palette-purple3',
            'selection:bg-palette-purple5'
          )}>
          <AppleAppStoreIcon className="absolute -bottom-16 -right-10 size-72 text-palette-purple10 opacity-10" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 !font-bold !text-palette-purple10 heading-lg">
              <AppleAppStoreIcon className="icon-lg text-palette-purple10" /> Deploy to TestFlight
            </h2>
            <div>
              <Terminal cmd={['$ npx testflight']} className="asset-shadow rounded-md" />
              <CALLOUT theme="secondary">
                This is an iOS-only command that will upload your app to TestFlight.
              </CALLOUT>
            </div>
          </div>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'min-h-[192px] bg-subtle bg-gradient-to-br from-subtle from-15% to-palette-green3',
            'selection:bg-palette-green4'
          )}>
          <Cloud01DuotoneIcon className="absolute -bottom-20 -right-8 size-80 text-[#1e8a5f] opacity-10 dark:text-[#4eca8c]" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="flex items-center gap-2 !font-bold !text-[#1e8a5f] heading-lg dark:!text-[#4eca8c]">
              <Cloud01DuotoneIcon className="icon-lg text-[#1e8a5f] dark:text-[#4eca8c]" /> Deploy
              your web app
            </h2>
            <div>
              <Terminal cmd={['$ npx eas-cli deploy']} className="asset-shadow rounded-md" />
              <CALLOUT theme="secondary">
                For prerequisites and complete instructions, see{' '}
                <A href="/deploy/web/#export-your-web-project/">our guide</A>.
              </CALLOUT>
            </div>
          </div>
        </GridCell>
      </GridContainer>
    </>
  );
}
