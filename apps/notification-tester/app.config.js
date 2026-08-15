const googleServicesFile = getGoogleServices();

export default ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile,
    },
  };
};

function getGoogleServices() {
  if (process.env.RELEASE) {
    return process.env.MICROFOAM_GOOGLE_SERVICES_JSON;
  } else if (process.env.PREVIEW) {
    return process.env.GOOGLE_SERVICES_JSON_PREVIEW;
  } else {
    return process.env.GOOGLE_SERVICES_JSON_DEV;
  }
}
