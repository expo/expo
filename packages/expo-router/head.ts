import { Head } from './src/head/index';

export default Head as unknown as React.FC<{ children?: React.ReactNode }> & {
  Provider: React.FC<{ children?: React.ReactNode; context: any }>;
};
