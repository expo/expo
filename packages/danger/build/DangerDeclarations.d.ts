import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';
declare global {
    var danger: DangerDSLType;
    function message(message: string, file?: string, line?: number): void;
    function warn(message: string, file?: string, line?: number): void;
    function fail(message: string, file?: string, line?: number): void;
    function markdown(message: string, file?: string, line?: number): void;
}
