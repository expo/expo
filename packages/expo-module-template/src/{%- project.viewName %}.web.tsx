import * as React from 'react';

import { <%- project.viewName %>Props } from './<%- project.name %>.types';

export default function <%- project.viewName %>(props: <%- project.viewName %>Props) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
