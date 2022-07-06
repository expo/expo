import * as React from 'react';

import { <%- project.name %>ViewProps } from './<%- project.name %>.types';

function <%- project.name %>WebView(props: <%- project.name %>ViewProps) {
  React.useEffect(() => {
    console.log(props.name);
  }, [props.name]);
  return <div />;
}

export default <%- project.name %>WebView;
