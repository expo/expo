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
        <GridCell className="bg-palette-orange3 border-palette-orange6 selection:bg-palette-orange5">
          <SnackImage />
          <RawH3 className="!text-palette-orange11 !font-bold">Try Expo in your browser</RawH3>
          <P className="!text-palette-orange11 !text-xs max-w-[24ch]">
            Expo’s Snack lets you try Expo with zero local setup.
          </P>
          <HomeButton
            className="bg-palette-orange11 border-palette-orange11 text-palette-orange3 hocus:bg-palette-orange11"
            href="https://snack.expo.dev/"
            target="_blank"
            rightSlot={<ArrowUpRightIcon className="text-palette-orange3 icon-md" />}>
            Create a Snack
          </HomeButton>
        </GridCell>
        <GridCell className="bg-palette-green3 border-palette-green6 selection:bg-palette-green5">
          <WhyImage />
          <RawH3 className="!text-palette-green11 !font-bold">Frequently Asked Questions</RawH3>
          <P className="!text-palette-green11 !text-xs max-w-[36ch]">
            Answers to common questions about Expo, EAS, and React Native.
          </P>
          <HomeButton
            className="bg-palette-green11 border-palette-green11 text-palette-green2 hocus:bg-palette-green11"
            href="/faq"
            rightSlot={<ArrowRightIcon className="text-palette-green2 icon-md" />}>
            Read FAQ
          </HomeButton>
        </GridCell>
        <GridCell className="bg-palette-yellow3 border-palette-yellow7 dark:border-palette-yellow6 selection:bg-palette-yellow5">
          <OfficeHoursImage />
          <RawH3 className="!text-palette-yellow11 !font-bold">Join us for Office Hours</RawH3>
          <P className="!text-palette-yellow11 !text-xs max-w-[28ch]">
            Check our Discord events for the next live Q&A session.
          </P>
          <HomeButton
            className="bg-palette-yellow11 border-palette-yellow11 text-palette-yellow2 hocus:bg-palette-yellow11"
            href="https://chat.expo.dev"
            rightSlot={<ArrowUpRightIcon className="text-palette-yellow2 icon-md" />}>
            Go to Discord
          </HomeButton>
        </GridCell>
        <GridCell className="bg-palette-blue3 border-palette-blue6 selection:bg-palette-blue5">
          <div className="absolute bottom-6 right-6 p-4 bg-palette-blue5 rounded-full">
            <DiscordIcon className="size-12 text-palette-blue9 dark:text-palette-blue9" />
          </div>
          <RawH3 className="!text-palette-blue11 !font-bold">Chat with the community</RawH3>
          <P className="!text-palette-blue11 !text-xs max-w-[32ch]">
            Join over 40,000 other developers
            <br />
            on the Expo Community Discord.
          </P>
          <HomeButton
            className="text-palette-blue1 hocus:bg-button-primary dark:bg-palette-blue9 dark:border-palette-blue9"
            href="https://chat.expo.dev"
            rightSlot={<ArrowUpRightIcon className="text-palette-blue2 icon-md" />}>
            Go to Discord
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
