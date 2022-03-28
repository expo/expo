declare module 'envinfo' {
  export function run(
    options: {
      System?: string[];
      Binaries?: string[];
      IDEs?: string[];
      Managers?: string[];
      SDKs?: string[];
      npmPackages?: string[];
      npmGlobalPackages?: string[];
    },
    props?: { yaml?: boolean; title?: string }
  ): Promise<string>;
}
