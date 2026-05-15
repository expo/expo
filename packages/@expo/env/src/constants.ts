import os from 'node:os';

const platform = os.platform();

// WARN(@kitten): We don't read this dynamically to ignore later modifications to this env var
const safeKeys = new Set(process.env.EXPO_UNSAFE_DOTENV_KEYS?.split(',').filter((x) => !!x));

export function isUnsafeAllowedEnvKey(name: string): boolean {
  return safeKeys.has(name);
}

export function isIgnoredEnvKey(name: string) {
  if (platform === 'darwin' && name.startsWith('DYLD_')) {
    return true;
  } else if (platform === 'linux' && name.startsWith('LD_')) {
    return true;
  } else if (safeKeys.has(name)) {
    return false;
  }

  // NOTE(@kitten): We exclude home vars such as ANDROID_HOME, JDK_HOME, DEVELOPER_DIR, etc
  // These could legitimately be customised per-project, and should be loaded
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

    default:
      return false;
  }
}
