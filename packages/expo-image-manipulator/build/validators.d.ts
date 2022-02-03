import { Action, SaveOptions } from './ImageManipulator.types';
export declare function validateArguments(uri: string, actions: Action[], saveOptions: SaveOptions): void;
export declare function validateUri(uri: string): void;
export declare function validateActions(actions: Action[]): void;
export declare function validateSaveOptions({ base64, compress, format }: SaveOptions): void;
//# sourceMappingURL=validators.d.ts.map