import { Platform, UnavailabilityError } from '@unimodules/core';
import ExpoImageManipulator from './ExpoImageManipulator';
import { SaveFormat } from './ImageManipulator.types';
import { validateArguments } from './validators';
export async function manipulateAsync(uri, actions = [], saveOptions = {}) {
    if (!ExpoImageManipulator.manipulateAsync) {
        throw new UnavailabilityError('ImageManipulator', 'manipulateAsync');
    }
    validateArguments(uri, actions, saveOptions);
    const { format = SaveFormat.JPEG, ...rest } = saveOptions;
    // If output format is JPEG add a white background, not necessary on iOS.
    if (format === SaveFormat.JPEG && Platform.OS !== 'ios') {
        actions.push({ fill: '#ffffff' });
    }
    return await ExpoImageManipulator.manipulateAsync(uri, actions, { format, ...rest });
}
export * from './ImageManipulator.types';
//# sourceMappingURL=ImageManipulator.js.map