import { Platform } from 'react-native';
import HMRClient from './HMRClient';
// Sets up developer tools for React Native web.
if (!Platform.isTesting) {
    HMRClient.log('log', [`JavaScript logs will appear in your browser console`]);
}
// This is called native on native platforms
HMRClient.setup({ isEnabled: true });
//# sourceMappingURL=hmr.js.map