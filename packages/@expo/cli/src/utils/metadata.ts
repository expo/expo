import { updateEventLoggerMetadata } from '2g';
import path from 'path';

declare module '2g' {
  interface MetadataRegistry {
    /** Absolute project root when it differs from the session working directory. */
    projectRoot: string;
    /** Default dev server is available. Consumers must also check session.alive. */
    ready: boolean;
    /** Default dev server URL, as shown by the non-interactive CLI. */
    devServerUrl: string | null;
    /** Actual local listening port, which may differ from the advertised URL. */
    port: number | null;
    /** Native launch URL; null for servers targeting only web. */
    runtimeUrl: string | null;
  }
}

export function updateProjectRootMetadata(projectRoot: string) {
  const resolvedRoot = path.resolve(projectRoot);
  if (resolvedRoot !== process.cwd()) {
    updateEventLoggerMetadata({ projectRoot: resolvedRoot });
  }
}
