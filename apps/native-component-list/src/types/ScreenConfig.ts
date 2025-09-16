import React from 'react';

export type ScreenConfig = {
  getComponent(): React.ComponentType<object> | (() => React.ReactElement);
  name: string;
  route?: string;
  options?: object;
  e2e?: boolean;
};

export type ScreenApiItem = {
  name: string;
  route: string;
  isAvailable: boolean;
};
