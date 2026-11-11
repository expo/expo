import { useConsent } from '@expo/styleguide-cookie-consent';
import { useEffect } from 'react';

import { cometlyPixelHost, cometlyPixelScriptUrl } from './cometly-constants';

const SCRIPT_ID = 'cometly-pixel';

type ShouldLoadOptions = {
  host: string;
  hasConsented: boolean;
  hasMarketing: boolean;
};

export function shouldLoadCometlyPixel({ host, hasConsented, hasMarketing }: ShouldLoadOptions) {
  return host === cometlyPixelHost && hasConsented && hasMarketing;
}

export function injectCometlyPixel(doc: Document = document) {
  if (doc.getElementById(SCRIPT_ID)) {
    return;
  }
  const script = doc.createElement('script');
  script.id = SCRIPT_ID;
  script.src = cometlyPixelScriptUrl;
  script.defer = true;
  doc.head.appendChild(script);
}

export function CometlyPixel() {
  const { marketing, hasConsented: userConsented } = useConsent();
  const hasMarketing = marketing === 'granted';

  useEffect(() => {
    if (
      shouldLoadCometlyPixel({
        host: window.location.host,
        hasConsented: userConsented,
        hasMarketing,
      })
    ) {
      injectCometlyPixel();
    }
  }, [userConsented, hasMarketing]);

  return null;
}
