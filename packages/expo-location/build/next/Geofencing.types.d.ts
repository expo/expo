export type GeofencingRegion = {
    id?: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    radius: number;
};
export declare enum GeofencingRegionState {
    UNKNOWN = "UNKNOWN",
    INSIDE = "INSIDE",
    OUTSIDE = "OUTSIDE"
}
export type GeofencingEvent = {
    region: GeofencingRegion;
    state: GeofencingRegionState;
};
export type GeofencingCallback = (event: GeofencingEvent) => void;
export type GeofencingModule = {
    startTaskAsync(name: string, regions: GeofencingRegion[]): Promise<void>;
    stopTaskAsync(name: string): Promise<void>;
    hasTaskStartedAsync(name: string): Promise<boolean>;
    addCallbackAsync(region: GeofencingRegion, callback: GeofencingCallback): Promise<string>;
    removeCallbackAsync(id: GeofencingRegion['id']): Promise<boolean>;
};
//# sourceMappingURL=Geofencing.types.d.ts.map