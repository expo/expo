import { ExternalModule } from './ExternalModule';

export interface NgrokOptions {
  authtoken?: string;
  port?: string | number | null;
  host?: string;
  httpauth?: string;
  region?: string;
  configPath?: string;

  proto?: 'http' | 'tcp' | 'tls';
  addr?: string;
  inspect?: boolean;
  auth?: string;
  host_header?: string;
  bind_tls?: true | false | 'both';
  subdomain?: string;
  hostname?: string;
  crt?: string;
  key?: string;
  client_cas?: string;
  remote_addr?: string;
}

export interface NgrokInstance {
  getActiveProcess(): { pid: number };
  connect(
    props: {
      hostname: string;
      configPath: string;
      onStatusChange: (status: string) => void;
    } & NgrokOptions
  );
  kill(): Promise<void>;
}

/** Resolves the ngrok instance from local or globally installed package. */
export class NgrokResolver extends ExternalModule<NgrokInstance> {
  constructor(projectRoot: string) {
    super(
      projectRoot,
      {
        name: '@expo/ngrok',
        versionRange: '^4.1.0',
      },
      (packageName) =>
        `The package ${packageName} is required to use tunnels, would you like to install it globally?`
    );
  }
}
