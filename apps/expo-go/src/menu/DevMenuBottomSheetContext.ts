import React from 'react';

export type Context = {
  expand: () => Promise<void>;
  collapse: () => Promise<void>;
};

const DevMenuBottomSheetContext = React.createContext<Context | null>(null);
DevMenuBottomSheetContext.displayName = 'DevMenuBottomSheetContext';

export default DevMenuBottomSheetContext;
