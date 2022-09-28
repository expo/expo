export default class BundlerController {
    private path;
    private process;
    constructor(path: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    private ensureBundlerWasStarted;
}
