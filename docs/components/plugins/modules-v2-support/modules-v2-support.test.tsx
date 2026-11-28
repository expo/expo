import { render, screen } from '@testing-library/react';

import { axe } from '~/common/test-utilities';

import { ModulesV2SupportTable } from './ModulesV2SupportTable';
import { getLanguageStatusLabel, getModulesV2Feature, modulesV2Features } from './data';

describe('modulesV2Features', () => {
  it('has unique IDs', () => {
    const ids = modulesV2Features.map(feature => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('labels each status', () => {
    expect(getLanguageStatusLabel('supported')).toBe('Supported');
    expect(getLanguageStatusLabel('not-supported')).toBe('Not supported yet');
  });

  it('throws for an unknown feature', () => {
    expect(() => getModulesV2Feature('unknown')).toThrow('Unknown Expo Modules API 2.0 feature');
  });
});

describe(ModulesV2SupportTable, () => {
  it('has a row for each feature', () => {
    render(<ModulesV2SupportTable />);
    expect(screen.getAllByRole('row')).toHaveLength(modulesV2Features.length + 1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ModulesV2SupportTable />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
