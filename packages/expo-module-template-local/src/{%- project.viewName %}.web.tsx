import * as React from 'react';

import { <%- project.viewName %>Props } from './<%- project.name %>.types';

export default function <%- project.viewName %>(props: <%- project.viewName %>Props) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
