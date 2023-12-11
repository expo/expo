declare module 'metro-transform-worker/src/utils/getMinifier' {
  import { Minifier } from 'metro-transform-worker';

  function getMinifier(path: string): Minifier;
  export default getMinifier;
}
