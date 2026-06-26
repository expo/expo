import { KapaProvider } from '@kapaai/react-sdk';

import { AskPageAIOverlay } from './AskPageAIOverlay';

const KAPA_INTEGRATION_ID = '2063233f-1e70-45e8-b1b5-a872c9887afc';

type AskPageAILazyMountProps = {
  onClose: () => void;
  onMinimize: () => void;
  pageTitle?: string;
  isExpoSdkPage?: boolean;
  isVisible: boolean;
  isExpanded: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

export default function AskPageAILazyMount(props: AskPageAILazyMountProps) {
  return (
    <KapaProvider integrationId={KAPA_INTEGRATION_ID} callbacks={{}}>
      <AskPageAIOverlay {...props} />
    </KapaProvider>
  );
}
