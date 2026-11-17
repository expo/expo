/** Entry module for the web renderer. */
import '@expo/metro-runtime';

export { getBuildTimeServerManifestAsync, getManifest } from '../static/getServerManifest';
export {
  getStreamingContent,
  resolveMetadata,
  type GetStreamingContentOptions,
} from './renderStreamingContent';
