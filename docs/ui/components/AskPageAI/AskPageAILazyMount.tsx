import { KapaProvider } from '@kapaai/react-sdk';
import { type ComponentProps } from 'react';

import { AskPageAIOverlay } from './AskPageAIOverlay';
import { KAPA_INTEGRATION_ID } from './kapaIntegrationId';

type AskPageAILazyMountProps = ComponentProps<typeof AskPageAIOverlay>;

export default function AskPageAILazyMount(props: AskPageAILazyMountProps) {
  return (
    <KapaProvider integrationId={KAPA_INTEGRATION_ID} callbacks={{}}>
      <AskPageAIOverlay {...props} />
    </KapaProvider>
  );
}
