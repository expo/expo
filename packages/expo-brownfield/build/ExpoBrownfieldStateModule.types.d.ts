import type { NativeModule } from 'expo';
<<<<<<< HEAD
export declare class ExpoBrownfieldStateModuleSpec extends NativeModule {
=======
export type KeyRecreatedEvent = {
    key: string;
};
export type Events = {
    onKeyRecreated: (event: KeyRecreatedEvent) => void;
};
export declare class ExpoBrownfieldStateModuleSpec extends NativeModule<Events> {
>>>>>>> main
    getSharedState(key: string): any;
    deleteSharedState(key: string): void;
}
//# sourceMappingURL=ExpoBrownfieldStateModule.types.d.ts.map