import React from 'react';

export type Context = {
  expand: () => any;
  collapse: () => any;
};

const DevMenuBottomSheetContext = React.createContext<Context | null>(null);
DevMenuBottomSheetContext.displayName = 'DevMenuBottomSheetContext';

export default DevMenuBottomSheetContext;
