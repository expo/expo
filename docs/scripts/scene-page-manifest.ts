/**
 * Scene-based pages where query params control client-rendered content.
 * The markdown pipeline uses this manifest to include every variant in one .md file.
 */

export interface SceneVariant {
  heading: string;
  mdxPath: string;
}

export interface ScenePage {
  htmlPath: string;
  variants: SceneVariant[];
  endHeading?: string;
}

const INSTRUCTIONS_DIR = 'scenes/get-started/set-up-your-environment/instructions';
const DEV_BUILDS_INSTRUCTIONS_DIR = 'scenes/develop/development-builds/instructions';

export const SCENE_PAGES: ScenePage[] = [
  {
    htmlPath: 'develop/development-builds/introduction/index.html',
    endHeading: '## After you install the development build',
    variants: [
      {
        heading: 'Switch from Expo Go to a development build',
        mdxPath: `${DEV_BUILDS_INSTRUCTIONS_DIR}/expo-go-to-dev-build.mdx`,
      },
      {
        heading: 'Create a development build with EAS',
        mdxPath: `${DEV_BUILDS_INSTRUCTIONS_DIR}/eas.mdx`,
      },
      {
        heading: 'Create a development build locally with EAS CLI',
        mdxPath: `${DEV_BUILDS_INSTRUCTIONS_DIR}/eas-cli-local.mdx`,
      },
    ],
  },
  {
    htmlPath: 'get-started/set-up-your-environment/index.html',
    variants: [
      {
        heading: 'Android device with Expo Go',
        mdxPath: `${INSTRUCTIONS_DIR}/androidPhysicalExpoGo.mdx`,
      },
      {
        heading: 'Android device with a development build (EAS)',
        mdxPath: `${INSTRUCTIONS_DIR}/androidPhysicalDevelopmentBuild.mdx`,
      },
      {
        heading: 'Android device with a development build (local)',
        mdxPath: `${INSTRUCTIONS_DIR}/androidPhysicalDevelopmentBuildLocal.mdx`,
      },
      {
        heading: 'Android Emulator with Expo Go',
        mdxPath: `${INSTRUCTIONS_DIR}/androidSimulatedExpoGo.mdx`,
      },
      {
        heading: 'Android Emulator with a development build (EAS)',
        mdxPath: `${INSTRUCTIONS_DIR}/androidSimulatedDevelopmentBuild.mdx`,
      },
      {
        heading: 'Android Emulator with a development build (local)',
        mdxPath: `${INSTRUCTIONS_DIR}/androidSimulatedDevelopmentBuildLocal.mdx`,
      },
      {
        heading: 'iOS device with Expo Go',
        mdxPath: `${INSTRUCTIONS_DIR}/iosPhysicalExpoGo.mdx`,
      },
      {
        heading: 'iOS device with a development build (EAS)',
        mdxPath: `${INSTRUCTIONS_DIR}/iosPhysicalDevelopmentBuild.mdx`,
      },
      {
        heading: 'iOS device with a development build (local)',
        mdxPath: `${INSTRUCTIONS_DIR}/iosPhysicalDevelopmentBuildLocal.mdx`,
      },
      {
        heading: 'iOS Simulator with Expo Go',
        mdxPath: `${INSTRUCTIONS_DIR}/iosSimulatedExpoGo.mdx`,
      },
      {
        heading: 'iOS Simulator with a development build (EAS)',
        mdxPath: `${INSTRUCTIONS_DIR}/iosSimulatedDevelopmentBuild.mdx`,
      },
      {
        heading: 'iOS Simulator with a development build (local)',
        mdxPath: `${INSTRUCTIONS_DIR}/iosSimulatedDevelopmentBuildLocal.mdx`,
      },
    ],
  },
];
