import { TokenResponse } from '@openid/appauth';
import { createContext } from 'react';

export default createContext<{
  auth: TokenResponse | null;
  setAuth: (value: TokenResponse | null) => void;
}>({ auth: null, setAuth() {} });
