import { RecordingOptions, RecordingOptionsAndroid, RecordingOptionsIos, RecordingOptionsWeb } from '../Audio.types';
type CommonRecordingOptions = {
    extension: string;
    sampleRate: number;
    numberOfChannels: number;
    bitRate: number;
    isMeteringEnabled: boolean;
};
export declare function createRecordingOptions(options: RecordingOptions): CommonRecordingOptions & (RecordingOptionsIos | RecordingOptionsAndroid | RecordingOptionsWeb);
export {};
//# sourceMappingURL=options.d.ts.map