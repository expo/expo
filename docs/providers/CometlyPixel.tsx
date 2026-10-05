import { useConsentManager } from '@expo/styleguide-cookie-consent';
import { useEffect } from 'react';

import {
  cometlyPixelHost,
  cometlyPixelScriptUrl,
  cometlyTokenCookieName,
  cometlyTokenStorageKey,
} from './cometly-constants';

const SCRIPT_ID = 'cometly-pixel';
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;

type ShouldLoadOptions = {
  host: string;
  hasConsented: boolean;
  hasMarketing: boolean;
};

export function shouldLoadCometlyPixel({ host, hasConsented, hasMarketing }: ShouldLoadOptions) {
  return host === cometlyPixelHost && hasConsented && hasMarketing;
}

export function getSharedCookieDomain(hostname: string) {
  const labels = hostname.split('.');
  return labels.length >= 2 ? `.${labels.slice(-2).join('.')}` : hostname;
}

function getSharedToken() {
  return document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith(`${cometlyTokenCookieName}=`))
    ?.split('=')[1];
}

function restoreSharedToken() {
  const sharedToken = getSharedToken();
  if (sharedToken) {
    localStorage.setItem(cometlyTokenStorageKey, sharedToken);
  }
}

function persistSharedToken() {
  const token = window.cometToken?.() ?? localStorage.getItem(cometlyTokenStorageKey);
  if (!token || getSharedToken() === token) {
    return;
  }
  const attributes = [
    `${cometlyTokenCookieName}=${token}`,
    `domain=${getSharedCookieDomain(window.location.hostname)}`,
    'path=/',
    `max-age=${ONE_YEAR_IN_SECONDS}`,
    'SameSite=Lax',
  ];
  if (window.location.protocol === 'https:') {
    attributes.push('Secure');
  }
  document.cookie = attributes.join('; ');
}

export function injectCometlyPixel(doc: Document = document) {
  if (doc.getElementById(SCRIPT_ID)) {
    return;
  }
  // An empty override list stops the script from appending comet_token_override to links.
  window.cometlyDomainOverrides = [];
  restoreSharedToken();
  const script = doc.createElement('script');
  script.id = SCRIPT_ID;
  script.src = cometlyPixelScriptUrl;
  script.defer = true;
  script.onload = persistSharedToken;
  doc.head.appendChild(script);
}

export function CometlyPixel() {
  const { has, hasConsented } = useConsentManager();
  const hasMarketing = has('marketing');
  const userConsented = hasConsented();

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
