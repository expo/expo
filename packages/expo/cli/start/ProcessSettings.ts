// This file represents globals for the CLI.

interface ProcessSettings {
  /** Name of this tool. */
  developerTool: 'expo-cli';
  /** Should the CLI skip making network requests. */
  isOffline: boolean;
}

const settings: ProcessSettings = {
  developerTool: 'expo-cli',
  isOffline: false,
};

export default settings;
