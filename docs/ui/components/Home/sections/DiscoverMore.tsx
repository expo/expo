import { mergeClasses } from '@expo/styleguide';
import { DiscordIcon } from '@expo/styleguide-icons/custom/DiscordIcon';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ArrowUpRightIcon } from '@expo/styleguide-icons/outline/ArrowUpRightIcon';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { OfficeHoursImage, SnackImage, WhyImage } from '~/ui/components/Home/resources';
import { P, RawH3 } from '~/ui/components/Text';

export function DiscoverMore() {
  return (
    <>
      <RawH3>Discover more</RawH3>
      <HeaderDescription>
        Try out Expo in minutes and learn how to get the most out of Expo.
      </HeaderDescription>
      <GridContainer>
        <GridCell
          className={mergeClasses(
            'border-palette-orange6 bg-palette-orange3 selection:bg-palette-orange5',
            'dark:border-palette-orange7 dark:bg-palette-orange4 dark:selection:bg-palette-orange6'
          )}>
          <SnackImage />
          <RawH3 className="!font-bold !text-palette-orange11">Try Expo in your browser</RawH3>
          <P className="max-w-[24ch] !text-xs !text-palette-orange11">
            Expo’s Snack lets you try Expo with zero local setup.
          </P>
          <HomeButton
            className={mergeClasses(
              'border-palette-orange11 bg-palette-orange11 text-palette-orange3 hocus:bg-palette-orange11',
              'dark:border-palette-orange10 dark:bg-palette-orange10'
            )}
            href="https://snack.expo.dev/"
            target="_blank"
            rightSlot={<ArrowUpRightIcon className="icon-md text-palette-orange3" />}>
            Create a Snack
          </HomeButton>
        </GridCell>
        <GridCell className="border-palette-green6 bg-palette-green3 selection:bg-palette-green5">
          <WhyImage />
          <RawH3 className="!font-bold !text-palette-green11">Frequently Asked Questions</RawH3>
          <P className="max-w-[36ch] !text-xs !text-palette-green11">
            Answers to common questions about Expo, EAS, and React Native.
          </P>
          <HomeButton
            className="border-palette-green11 bg-palette-green11 text-palette-green2 hocus:bg-palette-green11"
            href="/faq"
            rightSlot={<ArrowRightIcon className="icon-md text-palette-green2" />}>
            Read FAQ
          </HomeButton>
        </GridCell>
        <GridCell
          className={mergeClasses(
            'border-palette-yellow6 bg-palette-yellow3 selection:bg-palette-yellow5',
            'dark:border-palette-yellow7 dark:bg-palette-yellow4'
          )}>
          <OfficeHoursImage />
          <RawH3 className="!font-bold !text-palette-yellow11">Join us for Office Hours</RawH3>
          <P className="max-w-[28ch] !text-xs !text-palette-yellow11">
            Check our Discord events for the next live Q&A session.
          </P>
          <HomeButton
            className="border-palette-yellow11 bg-palette-yellow11 text-palette-yellow2 hocus:bg-palette-yellow11"
            href="https://chat.expo.dev"
            rightSlot={<ArrowUpRightIcon className="icon-md text-palette-yellow2" />}>
            Go to Discord
          </HomeButton>
        </GridCell>
        <GridCell className="border-palette-blue6 bg-palette-blue3 selection:bg-palette-blue5">
          <div className="absolute bottom-6 right-6 rounded-full bg-palette-blue5 p-4">
            <DiscordIcon className="size-12 text-palette-blue9 dark:text-palette-blue9" />
          </div>
          <RawH3 className="!font-bold !text-palette-blue11">Chat with the community</RawH3>
          <P className="max-w-[32ch] !text-xs !text-palette-blue11">
            Join over 40,000 other developers
            <br />
            on the Expo Community Discord.
          </P>
          <HomeButton
            className="text-palette-blue1 hocus:bg-button-primary dark:border-palette-blue9 dark:bg-palette-blue9"
            href="https://chat.expo.dev"
            rightSlot={<ArrowUpRightIcon className="icon-md text-palette-blue2" />}>
            Go to Discord
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
