import { Constants } from 'expo';

const isProduction = !!(
  Constants.manifest.id === '@exponent/home' && Constants.manifest.publishedTime
);

export default {
  isProduction,
};
