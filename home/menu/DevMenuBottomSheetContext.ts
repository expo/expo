import React from 'react';

type Context = {
  expand: () => any;
  collapse: () => any;
};

const DevMenuBottomSheetContext = React.createContext<Context | null>(null);
DevMenuBottomSheetContext.displayName = 'DevMenuBottomSheetContext';

export default DevMenuBottomSheetContext;
