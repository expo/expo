import { CookieConsentProvider } from '@expo/styleguide-cookie-consent';
import type { PropsWithChildren } from 'react';

const DATAGRAIL_CUSTOMER_ID = '1670e563-5fad-498c-829e-6e1ec0d72dc7';
const PRODUCTION_DATAGRAIL_CONTAINER_ID = '';
const STAGING_DATAGRAIL_CONTAINER_ID = 'a7095413-bb49-40c3-a291-2b78cd6ebb8f';
const GOOGLE_ANALYTICS_ID = 'G-YKNPYCMLWY';

const isDev = process.env.NODE_ENV === 'development';
const containerId = isDev ? STAGING_DATAGRAIL_CONTAINER_ID : PRODUCTION_DATAGRAIL_CONTAINER_ID;

export function ConsentProvider({ children }: PropsWithChildren) {
  return (
    <CookieConsentProvider
      customerId={DATAGRAIL_CUSTOMER_ID}
      containerId={containerId}
      ga4Id={GOOGLE_ANALYTICS_ID}
      // Off until the environment has a DataGrail container.
      disabled={!containerId}>
      {children}
    </CookieConsentProvider>
  );
}
