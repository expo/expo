import type { XcodeProject } from 'expo/config-plugins';

import { updateRegionsXcodeProject } from '../ios';

function createProject(firstProject: { developmentRegion?: string; knownRegions?: string[] }) {
  return {
    project: { getFirstProject: () => ({ firstProject }) } as unknown as XcodeProject,
    firstProject,
  };
}

describe(updateRegionsXcodeProject, () => {
  it('sets the development region and adds it to the known regions', () => {
    const { project, firstProject } = createProject({
      developmentRegion: 'en',
      knownRegions: ['en', 'Base'],
    });

    updateRegionsXcodeProject(project, { developmentRegion: 'pl' });

    expect(firstProject).toEqual({ developmentRegion: 'pl', knownRegions: ['pl', 'en', 'Base'] });
  });

  it('replaces the known regions and keeps Base and the development region', () => {
    const { project, firstProject } = createProject({
      developmentRegion: 'en',
      knownRegions: ['en', 'Base', 'fr'],
    });

    updateRegionsXcodeProject(project, { knownRegions: ['de', 'zh-Hans'] });

    expect(firstProject).toEqual({
      developmentRegion: 'en',
      knownRegions: ['en', 'Base', 'de', '"zh-Hans"'],
    });
  });

  it('quotes region names that contain a hyphen and does not add duplicates', () => {
    const { project, firstProject } = createProject({
      developmentRegion: 'en',
      knownRegions: ['en', 'Base', '"zh-Hans"'],
    });

    updateRegionsXcodeProject(project, { developmentRegion: 'zh-Hans' });

    expect(firstProject).toEqual({
      developmentRegion: '"zh-Hans"',
      knownRegions: ['"zh-Hans"', 'en', 'Base'],
    });
  });
});
