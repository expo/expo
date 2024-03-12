import { css } from '@emotion/react';
import { Button, DocsLogo, theme, typography } from '@expo/styleguide';
import { spacing, breakpoints, borderRadius } from '@expo/styleguide-base';
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  CameraPlusDuotoneIcon,
  DiscordIcon,
  GithubIcon,
  Image03DuotoneIcon,
  NotificationMessageDuotoneIcon,
  RedditIcon,
  XLogoIcon,
} from '@expo/styleguide-icons';
import type { PropsWithChildren } from 'react';
import { Row, ScreenClassProvider } from 'react-grid-system';

import DocumentationPage from '~/components/DocumentationPage';
import { TALKS } from '~/public/static/talks';
import { AppJSBanner } from '~/ui/components/AppJSBanner';
import {
  CellContainer,
  APIGridCell,
  CommunityGridCell,
  GridCell,
  HomeButton,
  TalkGridCell,
} from '~/ui/components/Home';
import {
  DevicesImage,
  DevicesImageMasks,
  OfficeHoursImage,
  QuickStartIcon,
  SnackImage,
  WhyImage,
} from '~/ui/components/Home/resources';
import { Terminal } from '~/ui/components/Snippet';
import { H1, RawH2, RawH3, P } from '~/ui/components/Text';

const Description = ({ children }: PropsWithChildren<object>) => (
  <P css={css({ marginTop: spacing[1], marginBottom: spacing[3], color: theme.text.secondary })}>
    {children}
  </P>
);

const Home = () => {
  const { palette, background } = theme;
  return (
    <ScreenClassProvider>
      <DocumentationPage hideTOC hideFromSearch>
        <div className="h-0">
          <DevicesImageMasks />
        </div>
        <H1 css={docsTitleStyle}>Create amazing apps that run everywhere</H1>
        <Description>
          Build one JavaScript/TypeScript project that runs natively on all your users' devices.
        </Description>
        <AppJSBanner />
        <CellContainer>
          <Row>
            <GridCell xl={4} lg={12} css={quickStartCellStyle}>
              <div
                css={[
                  baseGradientStyle,
                  css({
                    background: `linear-gradient(${background.subtle} 15%, #21262d00 100%)`,
                  }),
                ]}
              />
              <div className="flex flex-col gap-4 relative z-10">
                <RawH2>
                  <QuickStartIcon /> Quick Start
                </RawH2>
                <Terminal cmd={['$ npx create-expo-app my-app']} />
              </div>
            </GridCell>
            <GridCell
              xl={8}
              lg={12}
              css={[
                tutorialCellStyle,
                css({
                  borderColor: palette.blue7,
                  position: 'relative',
                  zIndex: 0,
                }),
              ]}>
              <div
                css={[
                  baseGradientStyle,
                  css({
                    background: `linear-gradient(${palette.blue4} 15%, #201d5200 100%)`,
                  }),
                ]}
              />
              <DevicesImage />
              <RawH2 css={css({ color: palette.blue12, zIndex: 1, position: 'relative' })}>
                Create a universal Android, iOS,
                <br />
                and web app
              </RawH2>
              <HomeButton
                className="hocus:bg-button-primary hocus:opacity-80"
                href="/tutorial/introduction/"
                rightSlot={<ArrowRightIcon className="icon-md" />}>
                Start Tutorial
              </HomeButton>
            </GridCell>
          </Row>
        </CellContainer>
        <RawH3>Learn more</RawH3>
        <Description>
          Try out Expo in minutes and learn how to get the most out of Expo.
        </Description>
        <CellContainer>
          <Row>
            <GridCell
              xl={6}
              lg={6}
              css={css({
                backgroundColor: palette.orange3,
                borderColor: palette.orange7,
              })}>
              <SnackImage />
              <RawH3 css={css({ color: palette.orange11 })}>Try Expo in your browser</RawH3>
              <P css={css({ color: palette.orange11, ...typography.fontSizes[14] })}>
                Expo’s Snack lets you try Expo
                <br />
                with zero local setup.
              </P>
              <HomeButton
                className="bg-palette-orange11 border-palette-orange11 text-palette-orange3 hocus:bg-palette-orange11 hocus:opacity-80"
                href="https://snack.expo.dev/"
                target="_blank"
                rightSlot={<ArrowUpRightIcon className="text-palette-orange3 icon-md" />}>
                Create a Snack
              </HomeButton>
            </GridCell>
            <GridCell
              xl={6}
              lg={6}
              css={css({
                backgroundColor: palette.green3,
                borderColor: palette.green7,
              })}>
              <WhyImage />
              <RawH3 css={css({ color: palette.green11 })}>Frequently Asked Questions</RawH3>
              <P css={{ color: palette.green11, ...typography.fontSizes[14] }}>
                Answers to common questions about Expo,
                <br />
                EAS, and React Native.
              </P>
              <HomeButton
                className="bg-palette-green11 border-palette-green11 text-palette-green2 hocus:bg-palette-green11 hocus:opacity-80"
                href="/faq"
                rightSlot={<ArrowRightIcon className="text-palette-green2 icon-md" />}>
                Read
              </HomeButton>
            </GridCell>
            <GridCell
              xl={6}
              lg={6}
              css={css({
                backgroundColor: palette.yellow3,
                borderColor: palette.yellow8,
              })}>
              <OfficeHoursImage />
              <RawH3 css={css({ color: palette.yellow11 })}>Join us for Office Hours</RawH3>
              <P css={css({ color: palette.yellow11, ...typography.fontSizes[14] })}>
                Get answers to your questions and
                <br />
                get advice from the Expo team.
              </P>
              <HomeButton
                className="bg-palette-yellow11 border-palette-yellow11 text-palette-yellow2 hocus:bg-palette-yellow11 hocus:opacity-80"
                href="https://us02web.zoom.us/meeting/register/tZcvceivqj0oHdGVOjEeKY0dRxCRPb0HzaAK"
                rightSlot={<ArrowUpRightIcon className="text-palette-yellow2 icon-md" />}>
                Register
              </HomeButton>
            </GridCell>
            <GridCell
              xl={6}
              lg={6}
              css={css({
                backgroundColor: palette.purple3,
                borderColor: palette.purple7,
              })}>
              <div className="absolute bottom-6 right-6 p-5 bg-palette-purple9 rounded-full">
                <DiscordIcon className="icon-2xl text-palette-white" />
              </div>
              <RawH3 css={css({ color: palette.purple11 })}>Chat with the community</RawH3>
              <P css={{ color: palette.purple11, ...typography.fontSizes[14] }}>
                Join over 20,000 other developers
                <br />
                on the Expo Community Discord.
              </P>
              <HomeButton
                className="bg-palette-purple11 border-palette-purple11 text-palette-purple2 hocus:bg-palette-purple11 hocus:opacity-80"
                href="https://chat.expo.dev"
                rightSlot={<ArrowUpRightIcon className="text-palette-gray2 icon-md" />}>
                Go to Discord
              </HomeButton>
            </GridCell>
          </Row>
        </CellContainer>
        <RawH3>Explore APIs</RawH3>
        <Description>
          Expo supplies a vast array of SDK modules. You can also create your own.
        </Description>
        <CellContainer>
          <Row>
            <APIGridCell
              title="Image"
              link="/versions/latest/sdk/image/"
              icon={<Image03DuotoneIcon className="size-16" />}
            />
            <APIGridCell
              title="Camera"
              link="/versions/latest/sdk/camera"
              icon={<CameraPlusDuotoneIcon className="size-16" />}
            />
            <APIGridCell
              title="Notifications"
              link="/versions/latest/sdk/notifications"
              icon={<NotificationMessageDuotoneIcon className="size-16" />}
            />
            <APIGridCell
              title="View all APIs"
              link="/versions/latest/"
              icon={<DocsLogo className="size-16" />}
            />
          </Row>
        </CellContainer>
        <div className="flex items-center gap-2">
          <div>
            <RawH3>Watch our latest talks</RawH3>
            <Description>
              Explore our team's presentations. Stay informed and gain expertise.
            </Description>
          </div>
          <Button
            theme="secondary"
            className="ml-auto"
            rightSlot={<ArrowRightIcon />}
            href="/additional-resources/#talks">
            See more talks
          </Button>
        </div>
        <CellContainer>
          <Row>
            {TALKS.filter(talk => talk.home).map(talk => (
              <TalkGridCell key={talk.videoId} {...talk} />
            ))}
          </Row>
        </CellContainer>
        <RawH3>Join the community</RawH3>
        <JoinTheCommunity />
      </DocumentationPage>
    </ScreenClassProvider>
  );
};

export function JoinTheCommunity() {
  return (
    <>
      <Description>See the source code, connect with others, and get connected.</Description>
      <CellContainer>
        <Row>
          <CommunityGridCell
            title="GitHub"
            description="View our SDK, submit a PR, or report an issue."
            link="https://github.com/expo/expo"
            icon={<GithubIcon className="icon-lg text-palette-white" />}
          />
          <CommunityGridCell
            title="Discord and Forums"
            description="Join our Discord to chat with Expo users or ask questions."
            link="https://chat.expo.dev"
            icon={<DiscordIcon className="icon-lg text-palette-white" />}
            iconBackground="#3131E8"
            shouldLeakReferrer
          />
        </Row>
        <Row>
          <CommunityGridCell
            title="X"
            description="Follow Expo on X for news and updates."
            link="https://x.com/expo"
            icon={<XLogoIcon className="icon-lg text-palette-white" />}
            iconBackground="#000000"
          />
          <CommunityGridCell
            title="Reddit"
            description="Get the latest on r/expo."
            link="https://www.reddit.com/r/expo"
            icon={<RedditIcon className="icon-lg text-palette-white" />}
            iconBackground="#FC471E"
          />
        </Row>
      </CellContainer>
    </>
  );
}

const docsTitleStyle = css({
  marginTop: spacing[2],
  marginBottom: spacing[2],
  paddingBottom: 0,
  borderBottomWidth: 0,
  fontWeight: '800',
});

const baseGradientStyle = css({
  top: 0,
  left: 0,
  zIndex: 1,
  width: '100%',
  height: '100%',
  position: 'absolute',
  borderRadius: borderRadius.lg,
});

const quickStartCellStyle = css({
  backgroundColor: theme.background.subtle,
  backgroundImage: 'url("/static/images/home/QuickStartPattern.svg")',
  backgroundBlendMode: 'multiply',
  minHeight: 220,

  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    minHeight: 200,
  },
});

const tutorialCellStyle = css({
  backgroundColor: theme.palette.blue4,
  backgroundImage: 'url("/static/images/home/TutorialPattern.svg")',
  backgroundBlendMode: 'multiply',
  minHeight: 220,

  [`@media screen and (max-width: ${breakpoints.medium}px)`]: {
    minHeight: 200,
  },
});

export default Home;
