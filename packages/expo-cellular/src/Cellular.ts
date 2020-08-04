import { UnavailabilityError } from '@unimodules/core';

import { CellularGeneration } from './Cellular.types';
import ExpoCellular from './ExpoCellular';

export { CellularGeneration };

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
