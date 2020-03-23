import { createContext } from 'react';

import Services from '../constants/Services';

export const defaultState = Object.keys(Services)[0];

export default createContext<{
  service: string;
  setService: (value: string) => void;
}>({ service: defaultState, setService() {} });
