import type { RecordingOptions, RecordingOptionsAndroid, RecordingOptionsIos, RecordingOptionsWeb } from '../Audio.types';
type CommonRecordingOptions = {
    extension: string;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    isMeteringEnabled: boolean;
};
type NativeRecordingOptions = {
    directory?: RecordingOptions['directory'];
};
export declare function createRecordingOptions(options: RecordingOptions): CommonRecordingOptions & ((NativeRecordingOptions & RecordingOptionsIos) | (NativeRecordingOptions & RecordingOptionsAndroid) | RecordingOptionsWeb);
export {};
//# sourceMappingURL=options.d.ts.map