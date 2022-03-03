// This file represents temporary globals for the CLI when using the API.
// Settings should be as minimal as possible since they are globals.

export const APISettings: {
  /** Should the CLI skip making network requests. */
  isOffline: boolean;
} = {
  isOffline: false,
};
