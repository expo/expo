// @ts-ignore: TODO -- monorepo issue
import { Head } from "expo-head";

export default Head as unknown as React.FC<{ children?: React.ReactNode }> & {
  Provider: React.FC<{ children?: React.ReactNode; context: any }>;
};
