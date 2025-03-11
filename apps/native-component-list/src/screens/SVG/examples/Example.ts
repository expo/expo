import React from 'react';

export default interface Example {
  icon: React.ReactElement;
  samples: (React.ComponentType & { title: string })[];
  scroll?: boolean;
}
