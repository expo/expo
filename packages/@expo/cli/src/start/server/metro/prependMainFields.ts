export function prependMainFields(
  baseMainFields: readonly string[],
  input: {
    enableModuleField: boolean;
    isServerEnv: boolean;
    userMainFields: readonly string[] | null | undefined;
  }
): readonly string[] {
  // We don't allow the config's main fields to re-order the base fields or to include any
  // conditions we're already appending
  const userMainFields = input.userMainFields?.filter((fieldName) => {
    switch (fieldName) {
      case 'main':
      case 'module':
      case 'react-native':
      case 'browser':
        return false;
      default:
        return !baseMainFields.includes(fieldName);
    }
  });

  const mainFields = [...(userMainFields ?? []), ...baseMainFields].filter(
    (fieldName, index, mainFields) => {
      return (
        fieldName !== 'main' &&
        fieldName !== 'module' &&
        fieldName !== 'browser' &&
        mainFields.indexOf(fieldName) === index
      );
    }
  );

  if (
    !input.isServerEnv &&
    (input.userMainFields?.includes('browser') || baseMainFields.includes('browser'))
  ) {
    mainFields.push('browser');
  }

  const userModuleIdx = input.userMainFields?.indexOf('module') ?? -1;
  const userMainIdx = input.userMainFields?.indexOf('main') ?? -1;
  // Depending on whether we're in ESM-import resolution mode, we have to either
  // prefer "module" or "main" over the other
  // In the future we should make this consitently and replace all of this with `mainFields.push('module', 'main')` always
  if (input.enableModuleField || (userModuleIdx > -1 && userModuleIdx < userMainIdx)) {
    // TODO(@kitten): A lot of react-native modules may not expect us to load `module`
    // first unless we're in an ESM import, so we currently only enable this for ESM imports.
    // Switch this to be consistent in the future.
    // We currently explicitly enable this if the user has requested `module` fields to be preferred
    mainFields.push('module', 'main');
  } else {
    mainFields.push('main');
    // Exception: If the user requested "module" to be included in the defaults we append
    // it after the "main" field here (ESM-only but without package.json:exports)
    // We also forcefully enable it for all server-side environments, since they always had it
    if (input.isServerEnv || userModuleIdx > -1) {
      mainFields.push('module');
    }
  }

  return mainFields;
}
