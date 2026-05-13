export async function getProviderStatusAsync(): Promise<any> {}

export async function getCurrentPositionAsync(options: any): Promise<any> {}

export async function getLastKnownPositionAsync(requirements: any): Promise<any> {}

export async function watchPositionImplAsync(watchId: number, options: any): Promise<any> {}

export async function watchDeviceHeading(watchId: number): Promise<any> {}

export async function removeWatchAsync(watchId: number): Promise<any> {}

export async function geocodeAsync(address: string): Promise<any> {}

export async function reverseGeocodeAsync(location: any): Promise<any> {}

export async function getPermissionsAsync(): Promise<any> {}

export async function requestPermissionsAsync(): Promise<any> {}

export async function getForegroundPermissionsAsync(): Promise<any> {}

export async function requestForegroundPermissionsAsync(): Promise<any> {}

export async function getBackgroundPermissionsAsync(): Promise<any> {}

export async function requestBackgroundPermissionsAsync(): Promise<any> {}

export async function hasServicesEnabledAsync(): Promise<any> {}

export async function startLocationUpdatesAsync(taskName: string, options: any): Promise<any> {}

export async function stopLocationUpdatesAsync(taskName: string): Promise<any> {}

export async function hasStartedLocationUpdatesAsync(taskName: string): Promise<any> {}

export async function startGeofencingAsync(taskName: string, options: any): Promise<any> {}

export async function stopGeofencingAsync(taskName: string): Promise<any> {}

export async function hasStartedGeofencingAsync(taskName: string): Promise<any> {}
