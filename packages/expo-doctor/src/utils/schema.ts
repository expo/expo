// copied from https://github.com/expo/expo-cli/blob/d00319aae4fdcacf1a335af5a8428c45b62fc4d7/packages/xdl/src/project/Doctor.ts
// minor naming changes only

import { ExpoConfig } from '@expo/config';
import Schemer, { SchemerError, ValidationError } from '@expo/schemer';

import { learnMore } from './TerminalLink';

function formatValidationError(validationError: ValidationError) {
  return `\n • ${validationError.fieldPath ? 'Field: ' + validationError.fieldPath + ' - ' : ''}${
    validationError.message
  }.`;
}

export async function validateWithSchemaAsync(
  projectRoot: string,
  {
    // Extract internal from the config object.
    _internal,
    ...exp
  }: ExpoConfig,
  schema: any,
  configName: string,
  validateAssets: boolean
): Promise<{ schemaErrorMessage: string | undefined; assetsErrorMessage: string | undefined }> {
  let schemaErrorMessage;
  let assetsErrorMessage;
  const validator = new Schemer(schema, { rootDir: projectRoot });

  // Validate the schema itself
  try {
    await validator.validateSchemaAsync(exp);
  } catch (e: any) {
    if (e instanceof SchemerError) {
      schemaErrorMessage = `Error: Problem${
        e.errors.length > 1 ? 's' : ''
      } validating fields in ${configName}. ${learnMore(
        'https://docs.expo.dev/workflow/configuration/'
      )}`;
      schemaErrorMessage += e.errors.map(formatValidationError).join('');
    }
  }

  if (validateAssets) {
    try {
      await validator.validateAssetsAsync(exp);
    } catch (e: any) {
      if (e instanceof SchemerError) {
        assetsErrorMessage = `Error: Problem${
          e.errors.length > 1 ? '' : 's'
        } validating asset fields in ${configName}. ${learnMore('https://docs.expo.dev/')}`;
        assetsErrorMessage += e.errors.map(formatValidationError).join('');
      }
    }
  }
  return { schemaErrorMessage, assetsErrorMessage };
}
