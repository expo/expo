class Env {
  get EXPO_DEBUG() {
    return ['true', '1'].includes((process.env.EXPO_DEBUG ?? '').toLowerCase());
  }

  get EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS() {
    return ['true', '1'].includes(
      (process.env.EXPO_CONFIG_PLUGIN_VERBOSE_ERRORS ?? '').toLowerCase()
    );
  }

  get EXPO_USE_UNVERSIONED_PLUGINS() {
    return ['true', '1'].includes((process.env.EXPO_USE_UNVERSIONED_PLUGINS ?? '').toLowerCase());
  }
}

export const env = new Env();
