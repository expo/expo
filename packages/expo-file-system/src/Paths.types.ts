export type PathInfo = {
  /**
   * Indicates whether the path exists. Returns true if it exists; false if the path does not exist or if there is no read permission.
   */
  exists: boolean;
  /**
   * Indicates whether the path is a directory. Returns true or false if the path exists; otherwise, returns null.
   */
  isDirectory: boolean | null;
};
