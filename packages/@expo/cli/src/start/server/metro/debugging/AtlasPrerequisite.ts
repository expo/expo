import { ProjectPrerequisite } from '../../../doctor/Prerequisite';
import {
  type EnsureDependenciesOptions,
  ensureDependenciesAsync,
} from '../../../doctor/dependencies/ensureDependenciesAsync';

export class AtlasPrerequisite extends ProjectPrerequisite<
  boolean,
  Pick<EnsureDependenciesOptions, 'exp'>
> {
  async assertImplementation({ exp }: Pick<EnsureDependenciesOptions, 'exp'> = {}) {
    await this.ensureAtlasInstalled({ exp });
    return true;
  }

  async bootstrapAsync({ exp }: Pick<EnsureDependenciesOptions, 'exp'> = {}) {
    await this.ensureAtlasInstalled({ exp, skipPrompt: true, isProjectMutable: true });
  }

  private async ensureAtlasInstalled(options: Partial<EnsureDependenciesOptions> = {}) {
    try {
      return await ensureDependenciesAsync(this.projectRoot, {
        ...options,
        installMessage:
          'Expo Atlas is required to gather bundle information, but it is not installed in this project.',
        warningMessage:
          'Expo Atlas is not installed in this project, unable to gather bundle information.',
        requiredPackages: [
          { version: '^0.3.0', pkg: 'expo-atlas', file: 'expo-atlas/package.json', dev: true },
        ],
      });
    } catch (error) {
      this.resetAssertion({});
      throw error;
    }
  }
}
