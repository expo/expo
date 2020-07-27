import hoistNonReactStatics from 'hoist-non-react-statics';
import * as React from 'react';
import { useSelector } from 'react-redux';

import isUserAuthenticated from './isUserAuthenticated';

function Authenticated({ children }: { children: any }) {
  const isAuthenticated = useSelector(data => isUserAuthenticated(data.session));
  if (isAuthenticated) {
    return children;
  }
  return null;
}

export default function onlyIfAuthenticated(TargetComponent: any): any {
  class OnlyIfAuthenticated extends React.Component {
    render() {
      return (
        <Authenticated>
          <TargetComponent {...this.props} />
        </Authenticated>
      );
    }
  }

  hoistNonReactStatics(OnlyIfAuthenticated, TargetComponent);

  return OnlyIfAuthenticated;
}
