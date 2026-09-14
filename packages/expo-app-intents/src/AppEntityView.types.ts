import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

/**
 * Props for a UIKit wrapper that associates its onscreen content with one App Entity.
 */
export type AppEntityViewProps = PropsWithChildren<
  ViewProps & {
    /** App-specific entity kind registered natively, for example `person` or `dish`. */
    entity: string;
    /** Stable entity id from the matching App Intents entity catalog. */
    entityId: string;
  }
>;
