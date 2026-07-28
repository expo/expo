import { KapaProvider } from '@kapaai/react-sdk';
import { type ComponentProps } from 'react';

import { AskPageAIOverlay } from './AskPageAIOverlay';

const KAPA_INTEGRATION_ID = '2063233f-1e70-45e8-b1b5-a872c9887afc';

type AskPageAILazyMountProps = ComponentProps<typeof AskPageAIOverlay>;

export default function AskPageAILazyMount(props: AskPageAILazyMountProps) {
  return (
    <KapaProvider integrationId={KAPA_INTEGRATION_ID} callbacks={{}}>
      <AskPageAIOverlay {...props} />
    </KapaProvider>
  );
}
