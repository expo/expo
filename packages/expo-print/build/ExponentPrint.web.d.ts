import { OrientationType } from './Print.types';
declare const _default: {
    readonly name: string;
    readonly Orientation: OrientationType;
    print(): Promise<void>;
    printToFileAsync(): Promise<void>;
};
export default _default;
