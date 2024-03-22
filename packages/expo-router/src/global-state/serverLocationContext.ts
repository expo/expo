// This is file should mirror https://github.com/react-navigation/react-navigation/blob/6.x/packages/native/src/ServerContext.tsx
import { createContext } from 'react';

export type ServerContextType = {
  location?: {
    pathname: string;
    search: string;
  };
};

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export default ServerContext;
