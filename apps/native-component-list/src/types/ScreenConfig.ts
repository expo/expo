import { type PathConfig } from '@react-navigation/native';
import React from 'react';

export type ScreenConfig = {
  getComponent(): React.ComponentType<object> | (() => React.ReactElement);
  name: string;
  route?: string;
  linking?: PathConfig<object>;
  options?: object;
};
