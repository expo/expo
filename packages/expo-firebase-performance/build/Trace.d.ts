export default class Trace {
    identifier: string;
    _nativeModule: any;
    constructor(nativeModule: any, identifier: string);
    getAttribute(attribute: string): Promise<string | null>;
    getAttributes(): Promise<Object>;
    getMetric(metricName: string): Promise<number>;
    incrementMetric(metricName: string, incrementBy: number): Promise<null>;
    putAttribute(attribute: string, value: string): Promise<boolean>;
    putMetric(metricName: string, value: number): Promise<null>;
    removeAttribute(attribute: string): Promise<null>;
    start(): Promise<null>;
    stop(): Promise<null>;
}
