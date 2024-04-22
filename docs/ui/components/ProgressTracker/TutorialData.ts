export type Chapter = {
  title: string;
  completed: boolean;
  slug: string;
};

// The following data is for the EAS Tutorial (/tutorial/eas/).
export const EAS_TUTORIAL_INITIAL_CHAPTERS: Chapter[] = [
  {
    title: 'Chapter 1: Configure development build in cloud',
    completed: false,
    slug: '/tutorial/eas/configure-development-build',
  },
  {
    title: 'Chapter 2: Create and run a cloud build for Android',
    completed: false,
    slug: '/tutorial/eas/android-development-build',
  },
  {
    title: 'Chapter 3: Create and run a cloud build for iOS Simulator',
    completed: false,
    slug: '/tutorial/eas/ios-development-build-for-simulators',
  },
  {
    title: 'Chapter 4: Create and run a cloud build for iOS device',
    completed: false,
    slug: '/tutorial/eas/ios-development-build-for-devices',
  },
  {
    title: 'Chapter 5: Configure multiple app variants',
    completed: false,
    slug: '/tutorial/eas/multiple-app-variants',
  },
  {
    title: 'Chapter 6: Create and share internal distribution build',
    completed: false,
    slug: '/tutorial/eas/internal-distribution-builds',
  },
  {
    title: 'Chapter 7: Manage different app versions',
    completed: false,
    slug: '/tutorial/eas/manage-app-versions',
  },
  {
    title: 'Chapter 8: Create a production build for Android',
    completed: false,
    slug: '/tutorial/eas/android-production-build',
  },
  {
    title: 'Chapter 9: Create a production build for iOS',
    completed: false,
    slug: '/tutorial/eas/ios-production-build',
  },
  {
    title: 'Chapter 10: Share previews with your team',
    completed: false,
    slug: '/tutorial/eas/team-development',
  },
  {
    title: 'Chapter 11: Trigger builds from a GitHub repository',
    completed: false,
    slug: '/tutorial/eas/using-github',
  },
];
