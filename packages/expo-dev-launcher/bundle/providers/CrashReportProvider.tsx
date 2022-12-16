import * as React from 'react';

import { CrashReport } from '../native-modules/DevLauncherInternal';

const Context = React.createContext<CrashReport | null>(null);
export const useCrashReport = () => React.useContext(Context);

type CrashReportProviderProps = {
  children: React.ReactNode;
  initialCrashReport?: CrashReport;
};

export function CrashReportProvider({
  children,
  initialCrashReport = null,
}: CrashReportProviderProps) {
  return <Context.Provider value={initialCrashReport}>{children}</Context.Provider>;
}
