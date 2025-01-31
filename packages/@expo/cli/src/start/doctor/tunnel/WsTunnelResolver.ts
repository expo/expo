import { ExternalModule } from './ExternalModule';

interface WsTunnelOptions {
  apiUrl?: string;
  session: string;
  maxReconnect?: number;
  onStatusChange?: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
}

export interface WsTunnelInstance {
  startAsync(config?: WsTunnelOptions): Promise<string>;
  stopAsync(): Promise<void>;
}

export class WsTunnelResolver extends ExternalModule<WsTunnelInstance> {
  constructor(projectRoot: string) {
    super(
      projectRoot,
      {
        name: '@expo/ws-tunnel',
        versionRange: '^1.0.0',
      },
      (packageName) =>
        `The package ${packageName} is required to use the tunnel, would you like to install it?`
    );
  }
}
