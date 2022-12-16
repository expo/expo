module.exports = (config, props) => {
  if (!config.extras) config.extras = {};
  config.extras.modified = true;
  if (props) {
    config.extras = { ...config.extras, ...props };
  }
  return config;
};
