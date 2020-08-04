import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';
declare global {
    var danger: DangerDSLType;
    function message(message: string): void;
    function warn(message: string): void;
    function fail(message: string): void;
    function markdown(message: string): void;
}
