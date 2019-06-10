import React from 'react';

export default interface Example {
  icon: JSX.Element;
  samples: Array<React.ComponentType & { title: string }>;
  scroll?: boolean;
}
