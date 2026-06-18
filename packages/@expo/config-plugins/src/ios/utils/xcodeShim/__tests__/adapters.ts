import xcode from 'xcode';
import LegacyPbxFile from 'xcode/lib/pbxFile';

/**
 * The project object + matching `pbxFile` constructor a scenario operates on.
 * Scenarios use only this surface so the same sequence runs against the legacy
 * library and the shim.
 */
export interface ScenarioContext {
  project: any;
  PbxFile: any;
}

/** Loads a fixture into a {@link ScenarioContext} for one backend. */
export interface Backend {
  readonly name: 'legacy' | 'shim';
  load(fixturePath: string): ScenarioContext;
}

export const legacyBackend: Backend = {
  name: 'legacy',
  load(fixturePath: string): ScenarioContext {
    const project = xcode.project(fixturePath);
    project.parseSync();
    return { project, PbxFile: LegacyPbxFile };
  },
};
