import { useRef } from 'react';
import AudioModule from './AudioModule';
export function useAudioPlayer(source = null) {
    return useRef(new AudioModule.AudioPlayer(source)).current;
}
//# sourceMappingURL=index.js.map