import { UnavailabilityError } from '@unimodules/core';

import ExponentCameraManager from './ExponentCameraManager';

export { default as Camera } from './Camera';
export { Constants } from './Camera';

export async function isAvailableAsync(): Promise<boolean> {
    if (!ExponentCameraManager.isAvailableAsync) {
        throw new UnavailabilityError('expo-camera', 'isAvailableAsync');
    }
    
    return await ExponentCameraManager.isAvailableAsync();
}