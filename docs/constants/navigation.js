// @preval

const mdx = require('@mdx-js/mdx');
const fs = require('fs-extra');
const glob = require('glob');
const yaml = require('js-yaml');
const path = require('path');

const { VERSIONS } = require('./versions');

/**
 * A simple reusable compiler to extract the frontmatter/yaml info.
 */
const mdxCompiler = mdx.createCompiler({
  remarkPlugins: [[require('remark-frontmatter'), ['yaml']]],
});

const PAGES_PATH = './pages';

module.exports = require('./old-navigation');

// --- SETTINGS ---

// --- NAVIGATION DATA ---

/**
 * In this file, we gather information from all pages and translate them to different types.
 * The data structure uses three different types.
 *   - Category, one or more sections to render in the sidebar
 *   - Section, one or more pages to render in the sidebar under category
 *   - Page, the information of a single page to render
 *
 * @typedef {import('~/common/navigation').Root} Root
 * @typedef {import('~/common/navigation').Page} Page
 */

/** @type {import('~/common/navigation').Root} */
const NAVIGATION = {
  type: 'root',
  children: [
    {
      type: 'category',
      title: 'Get Started',
      children: [
        {
          type: 'group',
          title: 'The Basics',
          open: true,
          children: [
            {
              type: 'section',
              title: 'Getting Started',
              children: getPages([
                'get-started/installation.md', // Installation
                'get-started/create-a-new-app.md', // Create a new app
                'get-started/errors.md', // Errors and debugging
              ]),
            },
            {
              type: 'section',
              title: 'Tutorial',
              children: getPages([
                'tutorial/planning.md', // First steps
                'tutorial/text.md', // Styling text
                'tutorial/image.md', // Adding an image
                'tutorial/button.md', // Creating a button
                'tutorial/image-picker.md', // Picking an image
                'tutorial/sharing.md', // Sharing the image
                'tutorial/platform-differences.md', // Handling platform differences
                'tutorial/configuration.md', // Configuring a splash screen and app icon
                'tutorial/follow-up.md', // Learning more
              ]),
            },
            {
              type: 'section',
              title: 'Conceptual Overview',
              children: getPages([
                'introduction/managed-vs-bare.md', // Workflows
                'introduction/walkthrough.md', // Walkthrough
                'introduction/why-not-expo.md', // Limitations
                'introduction/faq.md', // Common questions
              ]),
            },
            {
              type: 'section',
              title: 'Next Steps',
              children: getPages([
                'next-steps/using-the-documentation.md', // Using the documentation
                'next-steps/community.md', // Join the community
                'next-steps/additional-resources.md', // Additional resources
              ]),
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      title: 'Guides',
      children: [
        {
          type: 'group',
          title: 'Fundamentals',
          open: true,
          children: getPages([
            'workflow/expo-cli.md', // Expo CLI
            'workflow/using-libraries.md', // Using libraries
            'workflow/logging.md', // Viewing logs
            'workflow/development-mode.md', // Development and Production
            'workflow/ios-simulator.md', // iOS Simulator
            'workflow/android-studio-emulator.md', // Android Studio Emulator
            'workflow/debugging.md', // Debugging
            'workflow/configuration.md', // Configuration with app.json / app.config.js
            'workflow/publishing.md', // Publishing updates
            'workflow/upgrading-expo-sdk-walkthrough.md', // Upgrading Expo SDK
            'workflow/web.md', // Developing for Web
            'workflow/snack.md', // Snack: a playground in your browser
            'workflow/customizing.md', // Adding custom native code
            'workflow/glossary-of-terms.md', // Glossary of terms
            'workflow/already-used-react-native.md', // Already used React Native?
            'workflow/common-development-errors.md', // Common development errors
          ]),
        },
        {
          type: 'group',
          title: 'Distributing Your App',
          open: true,
          children: getPages([
            'distribution/introduction.md', // Overview
            'distribution/building-standalone-apps.md', // Building Standalone Apps
            'distribution/app-signing.md', // App Signing
            'distribution/app-stores.md', // Deploying to App Stores
            'distribution/release-channels.md', // Release Channels
            'distribution/advanced-release-channels.md', // Advanced Release Channels
            'distribution/runtime-versions.md', // Runtime Versions
            'distribution/webhooks.md', // Build Webhooks
            'distribution/hosting-your-app.md', // Hosting Updates on Your Servers
            'distribution/turtle-cli.md', // Building Standalone Apps on Your CI
            'distribution/uploading-apps.md', // Uploading Apps to the Apple App Store and Google Play
            'distribution/app-transfers.md', // App Transfers
            'distribution/security.md', // Security
            'distribution/optimizing-updates.md', // Optimizing Updates
            'distribution/publishing-websites.md', // Publishing Websites
          ]),
        },
        {
          type: 'group',
          title: 'Assorted Guides',
          open: true,
          children: getPages(glob.sync('guides/*.{md,mdx}', { cwd: PAGES_PATH })),
        },
        {
          type: 'group',
          title: 'Bare Workflow',
          open: true,
          children: getPages([
            'bare/hello-world.md', // Up and Running
            'bare/existing-apps.md', // Existing Apps
            'bare/installing-unimodules.md', // Installing react-native-unimodules
            'bare/installing-updates.md', // Installing expo-updates
            'bare/unimodules-full-list.md', // Supported Expo SDK APIs
            'bare/migrating-from-expokit.md', // Migrating from ExpoKit
            'bare/exploring-bare-workflow.md', // Bare Workflow Walkthrough
            'bare/updating-your-app.md', // Updating your App Over-the-Air
            'bare/using-expo-client.md', // Using Expo Go in Bare Workflow
            'bare/using-libraries.md', // Using libraries
            'bare/using-web.md', // Using Expo for web in Bare Workflow
          ]),
        },
        {
          type: 'group',
          title: 'Push Notifications',
          open: true,
          children: getPages([
            'push-notifications/overview.md', // Push Notifications Overview
            'push-notifications/push-notifications-setup.md', // Push Notifications Setup
            'push-notifications/sending-notifications.md', // Sending Notifications with Expo's Push API
            'push-notifications/sending-notifications-custom.md', // Sending Notifications with APNs & FCM
            'push-notifications/receiving-notifications.md', // Receiving Notifications
            'push-notifications/using-fcm.md', // Using FCM for Push Notifications
            'push-notifications/faq.md', // Push Notifications Troubleshooting & FAQ
          ]),
        },
        {
          type: 'group',
          title: 'UI Programming',
          open: false,
          children: getPages([
            'ui-programming/image-background.md', // Setting a component's background image
            'ui-programming/implementing-a-checkbox.md', // Implementing a checkbox for Expo and React Native apps
            'ui-programming/z-index.md', // Stacking overlapping views with zIndex in Expo and React Native apps
            'ui-programming/using-svgs.md', // Using SVGs
            'ui-programming/react-native-toast.md', // How to display a popup toast
            'ui-programming/react-native-styling-buttons.md', // Styling a React Native button
          ]),
        },
        {
          type: 'group',
          title: 'Regulatory Compliance',
          open: false,
          children: getPages([
            'regulatory-compliance/data-and-privacy-protection.md', // Data and Privacy Protection
            'regulatory-compliance/gdpr.md', // GDPR Compliance and Expo
            'regulatory-compliance/hipaa.md', // HIPAA Compliance and Expo
            'regulatory-compliance/privacy-shield.md', // Privacy Shield and Expo
          ]),
        },
        {
          type: 'group',
          title: 'Technical Specs',
          open: false,
          children: getPages([
            'technical-specs/expo-updates-0.md', // Expo Updates
            'technical-specs/expo-sfv-0.md', // Expo Structured Field Values
          ]),
        },
        {
          type: 'group',
          title: 'Deprecated',
          open: false,
          children: [
            {
              type: 'section',
              title: 'ExpoKit',
              children: getPages([
                'expokit/overview.md', // Overview
                'expokit/eject.md', // Ejecting to ExpoKit
                'expokit/expokit.md', // Developing With ExpoKit
                'expokit/advanced-expokit-topics.md', // Advanced ExpoKit Topics
                'expokit/universal-modules-and-expokit.md', // Universal Modules and ExpoKit
              ]),
            },
            {
              type: 'section',
              title: 'Archived',
              children: getPages([
                'archived/notification-channels.md', // Notification Channels
              ]),
            },
          ],
        },
      ],
    },
    {
      type: 'category',
      title: 'Feature Preview',
      children: [
        {
          type: 'group',
          title: 'EAS Build',
          children: [
            {
              type: 'section',
              title: 'Start Building',
              children: getPages([
                'build/introduction.md', // EAS Build
                'build/setup.md', // Creating your first build
                'build/eas-json.md', // Configuring EAS Build with eas.json
                'build/updates.md', // Over-the-air updates
                'build/internal-distribution.md', // Internal distribution
                'build/building-on-ci.md', // Triggering builds from CI
              ]),
            },
            {
              type: 'section',
              title: 'App Signing',
              children: getPages([
                'app-signing/managed-credentials.md', // Using automatically managed credentials
                'app-signing/local-credentials.md', // Using local credentials
                'app-signing/existing-credentials.md', // Using existing credentials
                'app-signing/syncing-credentials.md', // Syncing credentials between remote and local sources
              ]),
            },
            {
              type: 'section',
              title: 'Reference',
              children: getPages([
                'build-reference/migrating.md', // Migrating from "expo build"
                'build-reference/how-tos.md', // Integrating with third-party tooling
                'build-reference/variables.md', // Environment variables and secrets
                'build-reference/caching.md', // Caching dependencies
                'build-reference/local-builds.md', // Running builds on your own infrastructure
                'build-reference/build-webhook.md', // Build webhooks
                'build-reference/apk.md', // Building APKs for Android emulators and devices
                'build-reference/simulators.md', // Building for iOS simulators
                'build-reference/android-builds.md', // Android build process
                'build-reference/ios-builds.md', // iOS build process
                'build-reference/limitations.md', // Limitations
                'build-reference/build-configuration.md', // Build configuration process
                'build-reference/infrastructure.md', // Build server infrastructure
                'build-reference/ios-capabilities.md', // iOS Capabilities
              ]),
            },
          ],
        },
        {
          type: 'group',
          title: 'EAS Submit',
          children: getPages([
            'submit/introduction.md', // EAS Submit
            'submit/eas-json.md', // Configuring EAS Submit with eas.json
            'submit/android.md', // Submitting to the Google Play Store
            'submit/ios.md', // Submitting to the Apple App Store
            'submit/classic-builds.md', // Using EAS Submit with "expo build"
          ]),
        },
        {
          type: 'group',
          title: 'Development Clients',
          children: getPages([
            'clients/introduction.md', // Introduction
            'clients/getting-started.md', // Getting Started
            'clients/installation.md', // Installation in React Native and Bare workflow projects
            'clients/eas-build.md', // Building with EAS
            'clients/development-workflows.md', // Development Workflows
            'clients/compatibility.md', // Compatibility
            'clients/extending-the-dev-menu.md', // Extending the Dev Menu
            'clients/troubleshooting.md', // Troubleshooting
          ]),
        },
      ],
    },
    {
      type: 'category',
      title: 'Preview',
      hidden: true,
      children: [
        {
          type: 'group',
          title: 'Preview',
          children: getPages([
            'preview/introduction.md', // Introduction
            'preview/support.md', // Support and feedback
          ]),
        },
      ],
    },
    {
      type: 'api',
      title: 'API Reference',
      children: VERSIONS.map(sdkVersion => ({
        type: 'api-version',
        version: sdkVersion,
        children: [
          {
            type: 'group',
            title: 'Configuration Files',
            open: true,
            children: getPages([
              `versions/${sdkVersion}/config/app.md`, // app.json / app.config.js
              `versions/${sdkVersion}/config/metro.md`, // metro.config.js
            ]),
          },
          {
            type: 'group',
            title: 'Expo SDK',
            open: true,
            children: sortPagesByTitle(
              getPages(glob.sync(`versions/${sdkVersion}/sdk/*.{md,mdx}`, { cwd: PAGES_PATH }))
            ),
          },
          {
            type: 'group',
            title: 'React Native',
            open: true,
            children: sortPagesByTitle(
              getPages(
                glob.sync(`versions/${sdkVersion}/react-native/*.{md,mdx}`, { cwd: PAGES_PATH })
              )
            ),
          },
        ],
      })),
    },
  ],
};

// --- EXPORTS ---

// module.exports = {
//   startingDirectories: STARTING_DIRS,
//   previewDirectories: PREVIEW_DIRS,
//   featurePreviewDirectories: FEATURE_PREVIEW_DIRS,
//   generalDirectories: GENERAL_DIRS,
// };

// --- MDX HELPERS ---

/**
 * Parse the MDX page and extract the frontmatter/yaml page information.
 * This requires the `remark-frontmatter` MDX plugin.
 *
 * @param {string} filePath
 * @return {Page}
 */
function getPage(filePath) {
  const contents = fs.readFileSync(`${PAGES_PATH}/${filePath}`, 'utf-8');
  /** @type {import('mdast').Root} */
  const ast = mdxCompiler.parse({ contents, filepath: filePath });
  const node = ast.children.find(node => node.type === 'yaml');
  const data = node ? yaml.load(node.value) : { title: '' };

  if (!node) {
    console.error('Page does not have a starting YAML block:', filePath);
  } else if (!data.title) {
    console.error('Page does not have a `title`:', filePath);
  }

  return {
    type: 'page',
    file: filePath,
    url: getUrl(filePath),
    meta: data,
  };
}

function getUrl(filePath) {
  return `/${filePath.replace('.md', '/')}`;
}

function getPages(filePaths) {
  return filePaths.map(getPage);
}

function sortPagesByTitle(pages) {
  return pages.sort((a, b) => a.meta.title.localeCompare(b.meta.title));
}
