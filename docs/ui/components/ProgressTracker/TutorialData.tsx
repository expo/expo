import { type ReactNode } from 'react';

import { CODE } from '~/ui/components/Text';

export type Chapter = {
  title: string;
  slug: string;
  summary: ReactNode;
  nextDescription: string;
};

export type TutorialName = 'GET_STARTED' | 'EAS_TUTORIAL' | 'BUILD_WITH_AI' | 'CICD_TUTORIAL';

export type TutorialTrailer = {
  title: string;
  slug: string;
};

export const GET_STARTED_TUTORIAL_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: Create your first app',
    slug: '/tutorial/create-your-first-app',
    summary:
      "We've successfully created a new Expo project, used React Native core components, and are ready to develop our StickerSmash app.",
    nextDescription:
      'In the next chapter, we will learn how to add a stack and a tab navigator to our app.',
  },
  {
    title: 'Chapter 2: Add navigation',
    slug: '/tutorial/add-navigation',
    summary: "We've successfully added a stack and a tab navigator to our app.",
    nextDescription: "In the next chapter, we'll learn how to build the app's first screen.",
  },
  {
    title: 'Chapter 3: Build a screen',
    slug: '/tutorial/build-a-screen',
    summary:
      "We've successfully implemented the initial design to start building our app's first screen.",
    nextDescription:
      "In the next chapter, we'll add the functionality to pick an image from the device's media library.",
  },
  {
    title: 'Chapter 4: Use an image picker',
    slug: '/tutorial/image-picker',
    summary:
      "We've successfully added the functionality to pick an image from the device's media library.",
    nextDescription:
      "In the next chapter, we'll learn how to create an emoji picker modal component.",
  },
  {
    title: 'Chapter 5: Create a modal',
    slug: '/tutorial/create-a-modal',
    summary:
      "We've successfully created the emoji picker modal and implemented the logic to select an emoji and display it over the image.",
    nextDescription:
      "In the next chapter, let's add user interactions with gestures to drag the emoji and scale the size by tapping it.",
  },
  {
    title: 'Chapter 6: Add gestures',
    slug: '/tutorial/gestures',
    summary: "We've successfully implemented pan and tap gestures.",
    nextDescription:
      "In the next chapter, we'll learn how to take a screenshot of the image and the sticker, and save it on the device's library.",
  },
  {
    title: 'Chapter 7: Take a screenshot',
    slug: '/tutorial/screenshot',
    summary: (
      <>
        We've successfully used <CODE>react-native-view-shot</CODE> and{' '}
        <CODE>expo-media-library</CODE> to capture a screenshot and save it on the device's library.
      </>
    ),
    nextDescription:
      "In the next chapter, let's learn how to handle the differences between mobile and web platforms to implement the same functionality on web.",
  },
  {
    title: 'Chapter 8: Handle platform differences',
    slug: '/tutorial/platform-differences',
    summary:
      "The app does everything we set out for it to do, so it's time to shift our focus toward the purely aesthetic..",
    nextDescription:
      "In the next chapter, we will customize the app's status bar, splash screen, and app icon.",
  },
  {
    title: 'Chapter 9: Configure status bar, splash screen and app icon',
    slug: '/tutorial/configuration',
    summary:
      'Well done! We built an app that runs on Android, iOS, and the web from the same codebase.',
    nextDescription:
      "The next section of the tutorial will guide you toward resources to learn more about concepts we've covered here and others we have mentioned briefly.",
  },
];

export const EAS_TUTORIAL_INITIAL_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: Configure development build in cloud',
    slug: '/tutorial/eas/configure-development-build',
    summary:
      'We successfully used the EAS CLI to initialize, and configure our project, link it to EAS servers, and prepare a development build.',
    nextDescription:
      "In the next chapter, let's create a development build for Android, install it on a device and an emulator, and get it running with the development server.",
  },
  {
    title: 'Chapter 2: Create and run a cloud build for Android',
    slug: '/tutorial/eas/android-development-build',
    summary: (
      <>
        We successfully used EAS Build to create and run development builds on Android devices and
        emulators, and learned about <strong>.apk</strong> and <strong>.aab</strong> file formats.
      </>
    ),
    nextDescription:
      'In the next chapter, learn how to configure a development build for iOS Simulators using EAS Build and get it running.',
  },
  {
    title: 'Chapter 3: Create and run a cloud build for iOS Simulator',
    slug: '/tutorial/eas/ios-development-build-for-simulators',
    summary:
      'We successfully used EAS Build to create and run development builds on iOS Simulators.',
    nextDescription:
      "In the next chapter, let's create a development build for iOS, install it on a device, and get it running.",
  },
  {
    title: 'Chapter 4: Create and run a cloud build for iOS device',
    slug: '/tutorial/eas/ios-development-build-for-devices',
    summary: 'We successfully used EAS Build to create and run development builds on iOS devices.',
    nextDescription:
      'In the next chapter, learn how to configure our app config to install multiple app variants on a single device.',
  },
  {
    title: 'Chapter 5: Configure multiple app variants',
    slug: '/tutorial/eas/multiple-app-variants',
    summary: (
      <>
        We successfully created <strong>app.config.js</strong> just for our dynamic configuration
        while leaving static configuration in <strong>app.json</strong> unchanged, added environment
        variables in <strong>eas.json</strong> to configure specific build profile, and learned how
        to start the development server with a custom <strong>package.json</strong> script.
      </>
    ),
    nextDescription:
      'In the next chapter, learn about what are internal distribution builds, why we need them, and how to create them.',
  },
  {
    title: 'Chapter 6: Create and share internal distribution build',
    slug: '/tutorial/eas/internal-distribution-builds',
    summary:
      'We successfully created internal distribution builds for Android and iOS, used ad hoc provisioning for iOS, and installed multiple app variants on the same device.',
    nextDescription:
      'In the next chapter, learn about developer-facing and user-facing app versions and how to manage them automatically.',
  },
  {
    title: 'Chapter 7: Manage different app versions',
    slug: '/tutorial/eas/manage-app-versions',
    summary: (
      <>
        We successfully explored app versioning differences, addressed the importance of unique app
        versions to prevent store rejections, and enabled automated version updates in{' '}
        <strong>eas.json</strong> for production builds.
      </>
    ),
    nextDescription:
      'In the next chapter, learn about the process of creating a production build for Android.',
  },
  {
    title: 'Chapter 8: Create a production build for Android',
    slug: '/tutorial/eas/android-production-build',
    summary: (
      <>
        We successfully created a production-ready Android build, discussed manual and automated
        uploading to Google Play Store using <CODE>eas submit</CODE>, and automated the release
        process with the <CODE>--auto-submit</CODE>.
      </>
    ),
    nextDescription:
      'In the next chapter, learn about the process of creating a production build for iOS.',
  },
  {
    title: 'Chapter 9: Create a production build for iOS',
    slug: '/tutorial/eas/ios-production-build',
    summary: (
      <>
        We successfully created a production-ready iOS build, discussed distribution using
        TestFlight and Apple App Store using <CODE>eas submit</CODE>, and automated the release
        process with the <CODE>--auto-submit</CODE>.
      </>
    ),
    nextDescription:
      'In the next chapter, learn how to use the EAS Update to send OTA updates and share previews with our team.',
  },
  {
    title: 'Chapter 10: Share previews with your team',
    slug: '/tutorial/eas/team-development',
    summary:
      'We successfully configured  EAS Update to manage and publish over-the-air updates across platforms, and explored methods to fetch updates to review.',
    nextDescription:
      'In the next chapter, learn about the process of triggering builds from a GitHub repository.',
  },
  {
    title: 'Chapter 11: Trigger builds from a GitHub repository',
    slug: '/tutorial/eas/using-github',
    summary:
      'We successfully linked our GitHub account with Expo, connected our repository to our EAS project, and learned about automated development build creation using GitHub PR labels.',
    nextDescription: 'Learn about the next steps to use EAS.',
  },
];

export const BUILD_WITH_AI_TUTORIAL_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: Set up your tools',
    slug: '/tutorial/build-with-ai/set-up-your-tools',
    summary:
      'Your toolkit is complete: an AI agent that knows how to build Expo apps, Node.js to power the tooling, and Expo Go on your phone to see the results.',
    nextDescription:
      'In the next chapter, your agent creates a new app and you see it running on your phone.',
  },
  {
    title: 'Chapter 2: Create your first app',
    slug: '/tutorial/build-with-ai/create-your-first-app',
    summary: 'You created an app, ran it on your phone, and changed it with a single prompt.',
    nextDescription:
      "In the next chapter, you'll turn this empty screen into the real thing: navigation tabs, the photo viewer, and an image picker.",
  },
  {
    title: 'Chapter 3: Build the home screen',
    slug: '/tutorial/build-with-ai/build-the-home-screen',
    summary:
      "The app now has navigation, a styled home screen, and a working photo picker. You haven't touched a line of code.",
    nextDescription:
      "In the next chapter, you'll add an emoji picker modal and play with the sticker using gestures.",
  },
  {
    title: 'Chapter 4: Add stickers',
    slug: '/tutorial/build-with-ai/add-stickers',
    summary:
      "Your photo now wears a draggable, resizable emoji sticker. All that's missing is a way to keep your creation.",
    nextDescription:
      "In the next chapter, you'll save the decorated photo to your phone's photo library.",
  },
  {
    title: 'Chapter 5: Save your creation',
    slug: '/tutorial/build-with-ai/save-your-creation',
    summary:
      'StickerSmash is feature-complete: pick a photo, smash a sticker on it, and save the result, on your phone and even in the browser. One chapter to go.',
    nextDescription:
      "In the next chapter, you'll polish the status bar, splash screen, and app icon, and take your next steps.",
  },
  {
    title: 'Chapter 6: Finishing touches',
    slug: '/tutorial/build-with-ai/finishing-touches',
    summary:
      'Congratulations! You built StickerSmash from scratch by directing an AI agent, and polished it with a status bar, splash screen, and app icon.',
    nextDescription:
      'Curious what your agent actually wrote? The Expo tutorial builds the same app, explaining the code one step at a time.',
  },
];

export const CICD_TUTORIAL_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: First EAS Workflows job',
    slug: '/tutorial/cicd/first-workflow',
    summary:
      'We created a custom job workflow, triggered it manually and automatically, chained jobs using needs and outputs, and used the EAS dashboard to verify job execution.',
    nextDescription:
      'In the next chapter, learn how to automate development builds with fingerprinting to skip unnecessary rebuilds.',
  },
  {
    title: 'Chapter 2: Development builds',
    slug: '/tutorial/cicd/development-builds',
    summary:
      'We automated development builds using pre-packaged jobs, added fingerprints to skip unnecessary rebuilds, and integrated unit tests as a custom job before the build pipeline.',
    nextDescription:
      'In the next chapter, learn how to create preview builds with Slack notifications and PR preview updates.',
  },
  {
    title: 'Chapter 3: Preview builds',
    slug: '/tutorial/cicd/preview-builds',
    summary:
      'We created a preview build workflow with fingerprinting, added Slack notifications for build status, and set up PR previews using EAS Update so reviewers can test changes without checking out a branch.',
    nextDescription:
      'In the next chapter, learn how to run end-to-end tests with Maestro in an EAS Workflows job.',
  },
  {
    title: 'Chapter 4: E2E tests',
    slug: '/tutorial/cicd/e2e-tests',
    summary:
      'We created a Maestro E2E test workflow on development builds for Android and iOS, kept the trigger manual by default, and learned how to use a pull request label trigger for on-demand runs.',
    nextDescription:
      'In the next chapter, learn how to create a production workflow with fingerprinting and OTA updates.',
  },
  {
    title: 'Chapter 5: Production deployments',
    slug: '/tutorial/cicd/production',
    summary:
      'We created a production workflow for Android and iOS triggered by pushes to a release branch, used fingerprinting to choose between a native build and an OTA update, and saw how EAS Submit automates app store submissions.',
    nextDescription:
      'In the next chapter, learn how to switch production deployments from release branches to version tags.',
  },
  {
    title: 'Chapter 6: Tag-based releases',
    slug: '/tutorial/cicd/tag-based-releases',
    summary:
      'We switched the production workflow trigger from a release branch to a Git tag, tested the change by pushing a versioned tag from main, and learned how to gate release candidates with a pre-release tag glob.',
    nextDescription:
      'In the next chapter, learn how to deploy web builds to EAS Hosting from a workflow.',
  },
  {
    title: 'Chapter 7: Web deployments',
    slug: '/tutorial/cicd/web-deployments',
    summary:
      'We configured the Expo project for static web export, added a deploy job to the preview workflow for non-production web URLs, and added a deploy job with `prod: true` to the production workflow so every release ships the web build with the native release.',
    nextDescription: 'Learn about the next steps to use EAS Workflows.',
  },
];

export const TUTORIAL_CHAPTERS: Record<TutorialName, Chapter[]> = {
  GET_STARTED: GET_STARTED_TUTORIAL_CHAPTERS,
  EAS_TUTORIAL: EAS_TUTORIAL_INITIAL_CHAPTERS,
  BUILD_WITH_AI: BUILD_WITH_AI_TUTORIAL_CHAPTERS,
  CICD_TUTORIAL: CICD_TUTORIAL_CHAPTERS,
};

export const TUTORIAL_TRAILERS: Record<TutorialName, TutorialTrailer> = {
  GET_STARTED: { title: 'Learning resources', slug: '/tutorial/follow-up' },
  EAS_TUTORIAL: {
    title: 'Next steps in your journey with EAS',
    slug: '/tutorial/eas/next-steps',
  },
  BUILD_WITH_AI: { title: 'Expo tutorial', slug: '/tutorial/introduction' },
  CICD_TUTORIAL: {
    title: 'Next steps in your journey with EAS Workflows',
    slug: '/tutorial/cicd/next-steps',
  },
};
