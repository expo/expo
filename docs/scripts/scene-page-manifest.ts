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
}

const INSTRUCTIONS_DIR = 'scenes/get-started/set-up-your-environment/instructions';

export const SCENE_PAGES: ScenePage[] = [
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
