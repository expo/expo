import { CellularGeneration } from './Cellular.types';

export default {
  get allowsVoip(): null {
    return null;
  },
  get carrier(): null {
    return null;
  },
  get isoCountryCode(): null {
    return null;
  },
  get mobileCountryCode(): null {
    return null;
  },
  get mobileNetworkCode(): null {
    return null;
  },
  async getCellularGenerationAsync(): Promise<CellularGeneration | null> {
    let connection =
      navigator['connection'] ||
      navigator['mozConnection'] ||
      navigator['webkitConnection'] ||
      null;
    if (connection != null) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return Promise.resolve(CellularGeneration['2G']);
        case '3g':
          return Promise.resolve(CellularGeneration['3G']);
        case '4g':
          return Promise.resolve(CellularGeneration['4G']);
        default:
          return Promise.resolve(CellularGeneration.UNKNOWN);
      }
    } else {
      return Promise.resolve(CellularGeneration.UNKNOWN);
    }
  },
};
