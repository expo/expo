export type Options = {
  uri: string;
  projectRoot: string;
  ios?: boolean;
  android?: boolean;
  dryRun?: boolean;
  name?: string;
  role?: string;
  /**
   * Custom path to an AndroidManifest.xml
   */
  manifestPath?: string;
  /**
   * Custom path to an Info.plist
   */
  infoPath?: string;
};

export class CommandError extends Error {
  origin = 'uri-scheme';

  constructor(
    message: string,
    public command?: string
  ) {
    super(message);
  }
}
