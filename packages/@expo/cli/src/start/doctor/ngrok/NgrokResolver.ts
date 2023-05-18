import { ExternalModule } from './ExternalModule';

export class NgrokResolver extends ExternalModule<typeof import('@ngrok/ngrok')> {
  constructor(projectRoot: string) {
    super(
      projectRoot,
      {
        name: '@ngrok/ngrok',
        versionRange: '^0.4.1',
      },
      (packageName) =>
        `The package ${packageName} is required to use tunnels, would you like to install it globally?`
    );
  }
}
