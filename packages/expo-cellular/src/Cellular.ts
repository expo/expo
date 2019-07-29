import { UnavailabilityError } from '@unimodules/core';

import ExpoCellular from './ExpoCellular';
import { CellularGeneration } from './Cellular.types';

export const allowsVoip = ExpoCellular
  ? ExpoCellular.allowsVoip
    ? ExpoCellular.allowsVoip
    : null
  : null;
export const carrier = ExpoCellular ? (ExpoCellular.carrier ? ExpoCellular.carrier : null) : null;
export const isoCountryCode = ExpoCellular
  ? ExpoCellular.isoCountryCode
    ? ExpoCellular.isoCountryCode
    : null
  : null;
export const mobileCountryCode = ExpoCellular
  ? ExpoCellular.mobileCountryCode
    ? ExpoCellular.mobileCountryCode
    : null
  : null;
export const mobileNetworkCode = ExpoCellular
  ? ExpoCellular.mobileNetworkCode
    ? ExpoCellular.mobileNetworkCode
    : null
  : null;

export async function getCellularGenerationAsync(): Promise<CellularGeneration> {
  if (!ExpoCellular.getCellularGenerationAsync) {
    throw new UnavailabilityError('expo-cellular', 'getCellularGenerationAsync');
  }
  return await ExpoCellular.getCellularGenerationAsync();
}
