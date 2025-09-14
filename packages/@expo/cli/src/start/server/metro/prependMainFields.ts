export function prependMainFields(
  baseMainFields: readonly string[],
  input: {
    isESMImport: boolean;
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

  // Depending on whether we're in ESM-import resolution mode, we have to either
  // prefer "module" or "main" over the other
  if (input.isESMImport) {
    mainFields.push('module', 'main');
  } else {
    mainFields.push('main');
    // Exception: If the user requested "module" to be included in the defaults we append
    // it after the "main" field here (ESM-only but without package.json:exports)
    if (input.isServerEnv || input.userMainFields?.includes('module')) {
      mainFields.push('module');
    }
  }

  return mainFields;
}
