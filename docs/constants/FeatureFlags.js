// If you change the flag value, you need to restart the dev server.
const flags = {
  isDevClientInFeaturePreview: true,
};

const shouldShowFeaturePreviewLink = () => {
  return Object.values(flags).some(isInPreview => isInPreview);
};

module.exports = {
  ...flags,
  shouldShowFeaturePreviewLink,
};
