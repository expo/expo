import { UnavailabilityError } from '@unimodules/core';

import ExpoCellular from './ExpoCellular';

export const enum CellularGeneration {
    NULL = 0,
    "2G",
    "3G",
    "4G",
};

export const allowsVoip = ExpoCellular ? ExpoCellular.allowsVoip : null;
export const carrier = ExpoCellular ? ExpoCellular.carrier : null;
export const isoCountryCode = ExpoCellular ? ExpoCellular.isoCountryCode : null;
export const mobileCountryCode = ExpoCellular ? ExpoCellular.mobileCountryCode : null;
export const mobileNetworkCode = ExpoCellular ? ExpoCellular.mobileNetworkCode : null;

export async function getCellularGenerationAsync(): Promise<CellularGeneration> {
    if (!ExpoCellular.getCellularGenerationAsync) {
        throw new UnavailabilityError('expo-cellular', 'getCellularGenerationAsync');
    }
    return await ExpoCellular.getCellularGenerationAsync();
}