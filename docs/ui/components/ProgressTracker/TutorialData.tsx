export type Chapter = {
  title: string;
  completed: boolean;
};

// The following data is for the EAS Tutorial (/tutorial/eas/).
export const EAS_TUTORIAL_INITIAL_CHAPTERS: Chapter[] = [
  { title: 'Chapter 1: Configure development build in cloud', completed: false },
  { title: 'Chapter 2: Create and run a cloud build for Android', completed: false },
  { title: 'Chapter 3: Create and run a cloud build for iOS Simulator', completed: false },
  { title: 'Chapter 4: Create and run a cloud build for iOS device', completed: false },
  { title: 'Chapter 5: Configure multiple app variants', completed: false },
  { title: 'Chapter 6: Create and share internal distribution build', completed: false },
  { title: 'Chapter 7: Manage different app versions', completed: false },
  { title: 'Chapter 8: Create a production build for Android', completed: false },
  { title: 'Chapter 9: Create a production build for iOS', completed: false },
  { title: 'Chapter 10: Share previews with your team', completed: false },
  { title: 'Chapter 11: Trigger builds from a GitHub repository', completed: false },
];
