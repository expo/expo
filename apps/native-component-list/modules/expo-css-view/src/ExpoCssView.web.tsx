import * as React from 'react';

import { ExpoCssViewProps } from './ExpoCssView.types';

export default function ExpoCssView(props: ExpoCssViewProps) {
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
