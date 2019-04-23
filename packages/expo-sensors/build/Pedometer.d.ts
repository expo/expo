declare type PedometerResult = {
    steps: number;
};
declare type PedometerUpdateCallback = (result: PedometerResult) => void;
export interface PedometerListener {
    remove: () => void;
}
export declare function watchStepCount(callback: PedometerUpdateCallback): PedometerListener;
export declare function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult>;
export declare function isAvailableAsync(): Promise<boolean>;
export {};
