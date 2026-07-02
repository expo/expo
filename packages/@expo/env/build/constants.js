"use strict";

exports.__esModule = true;
exports.isIgnoredEnvKey = isIgnoredEnvKey;
exports.isLocalEnvKey = isLocalEnvKey;
exports.isUnsafeAllowedEnvKey = isUnsafeAllowedEnvKey;
function _nodeOs() {
  const data = _interopRequireDefault(require("node:os"));
  _nodeOs = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const platform = _nodeOs().default.platform();

// WARN(@kitten): We don't read this dynamically to ignore later modifications to this env var
const safeKeys = new Set(process.env.EXPO_UNSAFE_DOTENV_KEYS?.split(',').filter(x => !!x));
function isUnsafeAllowedEnvKey(name) {
  return safeKeys.has(name);
}
function isIgnoredEnvKey(name) {
  if (platform === 'darwin' && name.startsWith('DYLD_')) {
    return true;
  } else if (platform === 'linux' && name.startsWith('LD_')) {
    return true;
  } else if (safeKeys.has(name)) {
    return false;
  }

  // NOTE(@kitten): Per-developer tool roots (ANDROID_HOME, JDK_HOME, DEVELOPER_DIR,
  // npm/pnpm/yarn/bun paths, etc) are not blocked here — see `isLocalEnvKey`, which
  // restricts them to `.local` env files (gitignored by convention) so committed
  // `.env*` files cannot redirect them.
  switch (name) {
    // NOTE: Expo internal env vars
    case '__EXPO_ENV_LOADED':
    case 'EXPO_NO_DOTENV':
    case 'EXPO_UNSAFE_DOTENV_KEYS':
      return true;

    // Linux dynamic-loader, can cause inconsistent calls
    case 'LD_PRELOAD':
    case 'LD_LIBRARY_PATH':
    case 'LD_AUDIT':
      return true;

    // macOS dynamic-loader, can cause inconsistent calls
    case 'DYLD_INSERT_LIBRARIES':
    case 'DYLD_LIBRARY_PATH':
    case 'DYLD_FRAMEWORK_PATH':
    case 'DYLD_FALLBACK_LIBRARY_PATH':
    case 'DYLD_FALLBACK_FRAMEWORK_PATH':
      return true;

    // OpenSSL
    case 'SSLKEYLOGFILE':
      return true;

    // Changes Node behaviour and shouldn't be set in dotenv
    case 'NODE_PATH':
    case 'NODE_OPTIONS':
    case 'NODE_EXTRA_CA_CERTS':
    case 'NODE_TLS_REJECT_UNAUTHORIZED':
    case 'NODE_COMPILE_CACHE':
    case 'NPM_CONFIG_NODE_OPTIONS':
    case 'NODE_REPL_EXTERNAL_MODULE':
      return true;

    // Changes Bun behaviour and shouldn't be set in dotenv
    case 'BUN_RUNTIME_TRANSPILER_CACHE_PATH':
      return true;

    // Shell startup hooks
    case 'BASH_ENV':
    case 'ENV':
    case 'ZDOTDIR':
    case 'IFS':
    case 'CDPATH':
    case 'PROMPT_COMMAND':
    case 'SHELLOPTS':
    case 'BASHOPTS':
      return true;

    // Special git/ssh/gpg args
    case 'GIT_SSH':
    case 'GIT_SSH_COMMAND':
    case 'GPG_TTY':
    case 'SSH_ASKPASS':
    case 'GIT_ASKPASS':
    case 'GIT_EXEC_PATH':
      return true;

    // Perl libs
    case 'PERL5OPT':
    case 'PERL5LIB':
    case 'PERLLIB':
      return true;

    // Python modules
    case 'PYTHONSTARTUP':
    case 'PYTHONPATH':
    case 'PYTHONHOME':
    case 'PYTHONINSPECT':
    case 'PYTHONUSERBASE':
    case 'PYTHONEXECUTABLE':
    case 'PYTHONSAFEPATH':
    case 'PYTJONNOUSERSITE':
      return true;

    // Ruby libs
    case 'RUBYOPT':
    case 'RUBYLIB':
    case 'BUNDLE_GEMFILE':
    case 'RUBYSHELL':
    case 'RUBYPATH':
    case 'GEM_HOME':
    case 'GEM_PATH':
    case 'BUNDLE_PATH':
      return true;

    // Java vars
    case '_JAVA_OPTIONS':
    case 'JAVA_TOOL_OPTIONS':
    case 'JDK_JAVA_OPTIONS':
    case 'CLASSPATH':
      return true;

    // User env vars
    case 'HOME':
    case 'USERPROFILE':
    case 'HOMEDRIVE':
    case 'HOMEPATH':
    case 'TMPDIR':
    case 'TMP':
    case 'TEMP':
    case 'USER':
    case 'SHELL':
    case 'PATH':
    case 'PATHEXT':
    case 'LANG':
    case 'PWD':
    case 'OLDPWD':
    case 'TERMINFO':
      return true;

    // Windows-owned
    case 'SYSTEMROOT':
    case 'SystemRoot':
      return true;

    // User tools
    case 'EDITOR':
    case 'VISUAL':
    case 'PAGER':
    case 'MANPAGER':
      return true;

    // XDG dirs
    case 'XDG_RUNTIME_DIR':
    case 'XDG_STATE_HOME':
    case 'XDG_DATA_HOME':
    case 'XDG_CONFIG_DIRS':
    case 'XDG_CACHE_HOME':
    case 'XDG_CONFIG_HOME':
    case 'XDG_BIN_HOME':
      return true;

    // direnv
    case 'DIRENV_DIR':
    case 'DIRENV_FILE':
    case 'DIRENV_WATCHES':
    case 'DIRENV_DIFF':
      return true;

    // Package-manager registry/install roots. No legitimate per-project `.env`
    // use case — the established mechanism for each is a dedicated config file
    // (`.npmrc`, `.yarnrc.yml`, `.bunfig.toml`) — and a malicious value is a
    // supply-chain RCE the moment the CLI shells out to npm/yarn/pnpm/bun.
    case 'NPM_CONFIG_REGISTRY':
    case 'NPM_CONFIG_PREFIX':
    case 'NPM_CONFIG_USERCONFIG':
    case 'NPM_CONFIG_GLOBALCONFIG':
    case 'NPM_CONFIG_CACHE':
    case 'YARN_REGISTRY':
    case 'YARN_CACHE_FOLDER':
    case 'YARN_GLOBAL_FOLDER':
    case 'PNPM_HOME':
    case 'BUN_INSTALL':
    case 'BUN_INSTALL_BIN':
    case 'COCOAPODS_HOME':
    case 'CMAKE_HOME':
      return true;
    default:
      return false;
  }
}

/**
 * Whether a dotenv key represents per-developer/per-machine configuration that
 * should only be loaded from `.local` env files (e.g. `.env.local`,
 * `.env.development.local`). Committed `.env*` files cannot set these — that
 * prevents a malicious project from redirecting developer-tool roots (e.g.
 * `ANDROID_HOME`) via a supply-chain attack, while still letting developers
 * pin them in their gitignored `.local` overrides.
 *
 * Honors `EXPO_UNSAFE_DOTENV_KEYS`: opt-in keys are allowed in any env file.
 */
function isLocalEnvKey(name) {
  if (safeKeys.has(name)) return false;
  switch (name) {
    // Android tooling
    case 'ANDROID_HOME':
    case 'ANDROID_SDK_ROOT':
    case 'ANDROID_NDK_HOME':
    case 'ANDROID_NDK_ROOT':
    case 'ANDROID_AVD_HOME':
    case 'ANDROID_EMULATOR_HOME':
    case 'GRADLE_HOME':
    case 'GRADLE_USER_HOME':
    case 'KOTLIN_HOME':
      return true;

    // JVM tooling
    case 'JAVA_HOME':
    case 'JDK_HOME':
    case 'JRE_HOME':
      return true;

    // Apple tooling
    case 'DEVELOPER_DIR':
    case 'XCODE_DEVELOPER_DIR_PATH':
      return true;

    // CocoaPods / Fastlane (secrets and non-exec config)
    case 'COCOAPODS_DISABLE_STATS':
    case 'FASTLANE_USER':
    case 'FASTLANE_PASSWORD':
    case 'FASTLANE_SESSION':
    case 'FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD':
      return true;

    // Android NDK (per-project NDK version pinning is common)
    case 'NDK_HOME':
    case 'NDK_ROOT':
      return true;

    // Per-developer preferences and per-machine setup
    case 'BROWSER':
    case 'BROWSER_ARGS':
    case 'HTTP_PROXY':
    case 'http_proxy':
    case 'HTTPS_PROXY':
    case 'https_proxy':
    case 'ALL_PROXY':
    case 'all_proxy':
    case 'NO_PROXY':
    case 'no_proxy':
    case 'FTP_PROXY':
    case 'ftp_proxy':
    case 'SSL_CRT_FILE':
    case 'SSL_KEY_FILE':
    case 'REACT_NATIVE_PACKAGER_HOSTNAME':
      return true;
    // NOTE(@kitten): Used to override where hermesc is found, not safe to read from .env
    case 'REACT_NATIVE_OVERRIDE_HERMES_DIR':
      return true;
    default:
      return false;
  }
}
//# sourceMappingURL=constants.js.map