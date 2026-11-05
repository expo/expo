import { render, screen } from '@testing-library/react';

import { axe } from '~/common/test-utilities';

import { LanguageSupport } from './LanguageSupport';
import { ModulesV2SupportTable } from './ModulesV2SupportTable';
import { getModulesV2Feature, modulesV2Features } from './data';

describe('modulesV2Features', () => {
  it('has unique IDs', () => {
    const ids = modulesV2Features.map(feature => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('throws for an unknown feature', () => {
    expect(() => getModulesV2Feature('unknown')).toThrow('Unknown Expo Modules API 2.0 feature');
  });
});

describe(LanguageSupport, () => {
  it('shows the status in each language', () => {
    render(<LanguageSupport feature="unions" />);
    expect(screen.getByText('Kotlin: not supported yet')).toBeInTheDocument();
    expect(screen.getByText('Swift: supported')).toBeInTheDocument();
  });

  it('shows a missing status as not documented', () => {
    render(<LanguageSupport feature="tuples" />);
    expect(screen.getByText('Kotlin: not documented yet')).toBeInTheDocument();
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
