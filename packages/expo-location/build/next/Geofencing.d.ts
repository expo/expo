import { GeofencingCallback, GeofencingRegion } from './Geofencing.types';
export declare function startTaskAsync(name: string, regions?: GeofencingRegion[]): Promise<any>;
export declare function stopTaskAsync(name: string): Promise<any>;
export declare function hasTaskStartedAsync(name: string): Promise<boolean>;
export declare function addCallbackAsync(region: GeofencingRegion, callback: GeofencingCallback): Promise<string>;
export declare function removeCallbackAsync(id: GeofencingRegion['id']): Promise<boolean>;
//# sourceMappingURL=Geofencing.d.ts.map