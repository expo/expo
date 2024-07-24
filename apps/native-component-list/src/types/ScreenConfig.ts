import React from 'react';

export type ScreenConfig = {
  getComponent(): React.ComponentType<object> | (() => JSX.Element);
  name: string;
  route?: string;
  options?: object;
};
