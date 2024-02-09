import * as React from 'react';
import DevLoadingView from '../environment/DevLoadingView';
export function withDevTools(AppRootComponent) {
    function WithDevTools(props) {
        return (<>
        <AppRootComponent {...props}/>
        <DevLoadingView />
      </>);
    }
    if (process.env.NODE_ENV !== 'production') {
        const name = AppRootComponent.displayName || AppRootComponent.name || 'Anonymous';
        WithDevTools.displayName = `withDevTools(${name})`;
    }
    return WithDevTools;
}
//# sourceMappingURL=withDevTools.web.js.map