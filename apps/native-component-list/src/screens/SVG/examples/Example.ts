import React from 'react';

export default interface Example {
  icon: JSX.Element;
  samples: (React.ComponentType & { title: string })[];
  scroll?: boolean;
}
