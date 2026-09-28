import { render, screen } from '@testing-library/react';
import GithubSlugger from 'github-slugger';

import { createHeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/common/withHeadingManager';

import { MethodDefinitionData, TypeDocKind } from './APIDataTypes';
import { renderMethod } from './APISectionMethods';

const methodWithParameters = (parameterNames: string[]): MethodDefinitionData => ({
  name: 'useFocusEffect',
  kind: TypeDocKind.Function,
  signatures: [
    {
      name: 'useFocusEffect',
      comment: { summary: [] },
      parameters: parameterNames.map(name => ({
        name,
        kind: TypeDocKind.Parameter,
        type: { type: 'intrinsic', name: 'unknown' },
      })),
      type: { type: 'intrinsic', name: 'void' },
    },
  ],
});

test('adds a short anchor alias for the legacy useFocusEffect signature', () => {
  const { container } = render(
    <HeadingsContext.Provider value={createHeadingManager(new GithubSlugger(), { headings: [] })}>
      {renderMethod(methodWithParameters(['effect', 'do_not_pass_a_second_prop']), {
        sdkVersion: 'v57.0.0',
      })}
    </HeadingsContext.Provider>
  );

  expect(container).toContainHTML('id="usefocuseffecteffect"');
  expect(container).toContainHTML('id="usefocuseffecteffect-do_not_pass_a_second_prop"');
});

test('uses the short heading for the single-parameter signature', () => {
  const { container } = render(
    <HeadingsContext.Provider value={createHeadingManager(new GithubSlugger(), { headings: [] })}>
      {renderMethod(methodWithParameters(['effect']), { sdkVersion: 'unversioned' })}
    </HeadingsContext.Provider>
  );

  expect(screen.getByRole('heading', { name: /^useFocusEffect\(effect\)/ })).toBeInTheDocument();
  expect(container).toContainHTML('id="usefocuseffecteffect"');
  expect(container).not.toContainHTML('id="usefocuseffecteffect-do_not_pass_a_second_prop"');
});
