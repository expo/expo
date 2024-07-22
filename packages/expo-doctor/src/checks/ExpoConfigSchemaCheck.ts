import { getConfigFilePaths } from '@expo/config';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getSchemaAsync } from '../api/getSchemaAsync';
import { validateWithSchemaAsync } from '../utils/schema';

export class ExpoConfigSchemaCheck implements DoctorCheck {
  description = 'Check Expo config (app.json/ app.config.js) schema';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    let schema = await getSchemaAsync(exp.sdkVersion!);
    let isUsingUnversionedSchema = false;

    // If the schema is not available for the current SDK version, fall back to the unversioned schema (e.g., when using a canary SDK version).
    // During the SDK beta window, canary may return a schema version, as major version will match the next SDK version.
    if (!schema) {
      schema = await getSchemaAsync('UNVERSIONED');
      isUsingUnversionedSchema = true;
    }

    const configPaths = getConfigFilePaths(projectRoot);

    // this check can only validate a static config
    if (configPaths.staticConfigPath) {
      const { schemaErrorMessage, assetsErrorMessage } = await validateWithSchemaAsync(
        projectRoot,
        exp,
        schema,
        configPaths.staticConfigPath,
        true
      );

      if (schemaErrorMessage) {
        issues.push(schemaErrorMessage!);
      }
      if (assetsErrorMessage) {
        issues.push(assetsErrorMessage!);
      }

      if (isUsingUnversionedSchema && issues.length > 0) {
        issues.push(
          `Warning: we could not find a schema for SDK version ${exp.sdkVersion}, used UNVERSIONED schema instead. This is expected when using a canary SDK version.`
        );
      }
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}
