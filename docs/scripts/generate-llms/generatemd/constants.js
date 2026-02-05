export const PLATFORM_AND_DEVICE_MARKDOWN = `## Where would you like to develop?\n\nYou can work on any of the following targets during development:\n\n- **Android device** — run the app on hardware so you see exactly what your users see.\n- **iOS device** — test on Apple hardware for the most accurate experience.\n- **Android Emulator** — use a virtual Android device when you do not have physical hardware.\n- **iOS Simulator** — run the iOS Simulator on macOS to test without a device.`;

export const DEVELOPMENT_MODE_MARKDOWN = `## How would you like to develop?\n\n- **Expo Go** — a sandbox app from Expo for trying things out quickly without custom native modules.\n- **Development build** — your own app binary that includes Expo developer tools and supports custom native modules, intended for longer-term projects.`;

export const BUILD_ENVIRONMENT_TEXT =
  '**Build with Expo Application Services (EAS)**\n\nEAS compiles your app in the cloud and produces a build that you can install on your device. Alternatively, you can compile your app on your own computer.';

export const ENVIRONMENT_INSTRUCTION_SECTIONS = [
  {
    heading: 'Android device — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalExpoGo.mdx',
  },
  {
    heading: 'Android device — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalDevelopmentBuild.mdx',
  },
  {
    heading: 'Android device — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidPhysicalDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'Android Emulator — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedExpoGo.mdx',
  },
  {
    heading: 'Android Emulator — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedDevelopmentBuild.mdx',
  },
  {
    heading: 'Android Emulator — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/androidSimulatedDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'iOS device — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalExpoGo.mdx',
  },
  {
    heading: 'iOS device — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalDevelopmentBuild.mdx',
  },
  {
    heading: 'iOS device — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosPhysicalDevelopmentBuildLocal.mdx',
  },
  {
    heading: 'iOS Simulator — Expo Go',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedExpoGo.mdx',
  },
  {
    heading: 'iOS Simulator — Development build (EAS)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedDevelopmentBuild.mdx',
  },
  {
    heading: 'iOS Simulator — Development build (local)',
    path: 'scenes/get-started/set-up-your-environment/instructions/iosSimulatedDevelopmentBuildLocal.mdx',
  },
];

export const PROJECT_STRUCTURE_SECTIONS = [
  'scenes/get-started/start-developing/ProjectStructure/files/app.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/assets.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/components.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/constants.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/hooks.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/scripts.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/app-json.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/package-json.mdx',
  'scenes/get-started/start-developing/ProjectStructure/files/tsconfig-json.mdx',
];

export const TEMPLATE_FEATURE_SECTIONS = [
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/navigation.mdx',
    href: '/router/introduction',
  },
  { file: 'scenes/get-started/start-developing/TemplateFeatures/features/platforms.mdx' },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/images.mdx',
    href: '/versions/latest/sdk/image',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/themes.mdx',
    href: '/develop/user-interface/color-themes',
  },
  {
    file: 'scenes/get-started/start-developing/TemplateFeatures/features/animations.mdx',
    href: '/develop/user-interface/animation',
  },
];
