import { getConfigFilePaths } from '@expo/config';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';
import { getSchemaAsync } from '../api/getSchemaAsync';
import { validateWithSchemaAsync } from '../utils/schema';

export class ExpoConfigSchemaCheck implements DoctorCheck {
  description = 'Check Expo config (app.json/ app.config.js) schema';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const schema = await getSchemaAsync(exp.sdkVersion!);

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
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}
