import { OrientationConstant } from './Print.types';
declare const _default: {
    readonly name: string;
    readonly Orientation: OrientationConstant;
    print(): Promise<void>;
    printToFileAsync(): Promise<void>;
};
export default _default;
