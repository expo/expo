import { UnavailabilityError } from '@unimodules/core';
import ExpoImageManipulator from './ExpoImageManipulator';
import { SaveFormat } from './ImageManipulator.types';
export async function manipulateAsync(uri, actions = [], { format = SaveFormat.JPEG, ...rest } = {}) {
    if (!ExpoImageManipulator.manipulateAsync) {
        throw new UnavailabilityError('ImageManipulator', 'manipulateAsync');
    }
    if (!(typeof uri === 'string')) {
        throw new TypeError('The "uri" argument must be a string');
    }
    return await ExpoImageManipulator.manipulateAsync(uri, actions, { format, ...rest });
}
export * from './ImageManipulator.types';
//# sourceMappingURL=ImageManipulator.js.map