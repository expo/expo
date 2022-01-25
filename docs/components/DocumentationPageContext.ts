import * as React from 'react';

// TODO(cedric): remove version from this context, its deprecated. Use ApiVersion context instead.
export default React.createContext<{ version?: string; packageName?: string }>({});
