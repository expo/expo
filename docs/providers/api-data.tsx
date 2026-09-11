import { createContext, useContext, type PropsWithChildren } from 'react';

export type ApiSectionData = Record<string, unknown>;

const ApiDataContext = createContext<ApiSectionData | undefined>(undefined);

/**
 * Serves the per-page API reference data loaded by the generated `getStaticProps`
 * (see mdx-plugins/remark-api-section-data.js), keyed by `<sdkVersion>/<packageName>`.
 */
export function ApiDataProvider({ data, children }: PropsWithChildren<{ data?: ApiSectionData }>) {
  return <ApiDataContext.Provider value={data}>{children}</ApiDataContext.Provider>;
}

export function useApiSectionData() {
  return useContext(ApiDataContext);
}
