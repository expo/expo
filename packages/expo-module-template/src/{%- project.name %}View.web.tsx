import * as React from 'react';

import { <%- project.name %>ViewProps } from './<%- project.name %>.types';

function <%- project.name %>WebView(props: <%- project.name %>ViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}

export default <%- project.name %>WebView;
