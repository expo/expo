import { configFilename } from '@expo/config';

import { getSchemaAsync } from '../api/getSchemaAsync';
import { validateWithSchemaAsync } from '../utils/schema';
import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export class ExpoConfigSchemaCheck implements DoctorCheck {
  description = 'Check Expo config (app.json/ app.config.js) schema';

  sdkVersionRange = '*';

  async runAsync({ exp, projectRoot }: DoctorCheckParams): Promise<DoctorCheckResult> {
    const issues: string[] = [];

    const schema = await getSchemaAsync(exp.sdkVersion!);

    const configName = configFilename(projectRoot);

    const { schemaErrorMessage, assetsErrorMessage } = await validateWithSchemaAsync(
      projectRoot,
      exp,
      schema,
      configName,
      true
    );

    if (schemaErrorMessage) {
      issues.push(schemaErrorMessage!);
    }
    if (assetsErrorMessage) {
      issues.push(assetsErrorMessage!);
    }

    return {
      isSuccessful: issues.length === 0,
      issues,
    };
  }
}
