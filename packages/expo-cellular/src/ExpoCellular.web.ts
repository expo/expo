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
  async getCellularGenerationAsync(): Promise<CellularGeneration> {
    const connection =
      // @ts-expect-error
      navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
    if (connection !== null) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return CellularGeneration.CELLULAR_2G;
        case '3g':
          return CellularGeneration.CELLULAR_3G;
        case '4g':
          return CellularGeneration.CELLULAR_4G;
        default:
          return CellularGeneration.UNKNOWN;
      }
    } else {
      return CellularGeneration.UNKNOWN;
    }
  },

  async allowsVoipAsync(): Promise<boolean | null> {
    return null;
  },
  async getIsoCountryCodeAsync(): Promise<string | null> {
    return null;
  },
  async getCarrierNameAsync(): Promise<string | null> {
    return null;
  },
  async getMobileCountryCodeAsync(): Promise<string | null> {
    return null;
  },
  async getMobileNetworkCodeAsync(): Promise<string | null> {
    return null;
  },
};
