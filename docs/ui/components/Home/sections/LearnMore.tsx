import { ArrowRightIcon, ArrowUpRightIcon, DiscordIcon } from '@expo/styleguide-icons';

import { GridContainer, GridCell, HeaderDescription, HomeButton } from '~/ui/components/Home';
import { OfficeHoursImage, SnackImage, WhyImage } from '~/ui/components/Home/resources';
import { P, RawH3 } from '~/ui/components/Text';

export function LearnMore() {
  return (
    <>
      <RawH3>Learn more</RawH3>
      <HeaderDescription>
        Try out Expo in minutes and learn how to get the most out of Expo.
      </HeaderDescription>
      <GridContainer>
        <GridCell className="bg-palette-orange3 border-palette-orange7">
          <SnackImage />
          <RawH3 className="!text-palette-orange11">Try Expo in your browser</RawH3>
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
        <GridCell className="bg-palette-green3 border-palette-green7">
          <WhyImage />
          <RawH3 className="!text-palette-green11">Frequently Asked Questions</RawH3>
          <P className="!text-palette-green11 !text-xs max-w-[36ch]">
            Answers to common questions about Expo, EAS, and React Native.
          </P>
          <HomeButton
            className="bg-palette-green11 border-palette-green11 text-palette-green2 hocus:bg-palette-green11"
            href="/faq"
            rightSlot={<ArrowRightIcon className="text-palette-green2 icon-md" />}>
            Read
          </HomeButton>
        </GridCell>
        <GridCell className="bg-palette-yellow3 border-palette-yellow8">
          <OfficeHoursImage />
          <RawH3 className="!text-palette-yellow11">Join us for Office Hours</RawH3>
          <P className="!text-palette-yellow11 !text-xs max-w-[28ch]">
            Get answers to your questions and get advice from the Expo team.
          </P>
          <HomeButton
            className="bg-palette-yellow11 border-palette-yellow11 text-palette-yellow2 hocus:bg-palette-yellow11"
            href="https://us02web.zoom.us/meeting/register/tZcvceivqj0oHdGVOjEeKY0dRxCRPb0HzaAK"
            rightSlot={<ArrowUpRightIcon className="text-palette-yellow2 icon-md" />}>
            Register
          </HomeButton>
        </GridCell>
        <GridCell className="bg-palette-purple3 border-palette-purple7">
          <div className="absolute bottom-6 right-6 p-4 bg-palette-purple9 rounded-full">
            <DiscordIcon className="size-14 text-palette-white" />
          </div>
          <RawH3 className="!text-palette-purple11">Chat with the community</RawH3>
          <P className="!text-palette-purple11 !text-xs max-w-[32ch]">
            Join over 20,000 other developers
            <br />
            on the Expo Community Discord.
          </P>
          <HomeButton
            className="bg-palette-purple11 border-palette-purple11 text-palette-purple2 hocus:bg-palette-purple11"
            href="https://chat.expo.dev"
            rightSlot={<ArrowUpRightIcon className="text-palette-gray2 icon-md" />}>
            Go to Discord
          </HomeButton>
        </GridCell>
      </GridContainer>
    </>
  );
}
