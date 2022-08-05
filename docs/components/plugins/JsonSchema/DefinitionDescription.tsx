import MDX from '@mdx-js/runtime';

import * as mdxComponents from '~/common/translate-markdown';
import { P } from '~/ui/components/Text';
import { DefinitionRenderProps } from './Definition';

export function DefinitionDescription({ definition }: DefinitionRenderProps) {
  if (definition.markdownDescription) {
    return (
      <MDX components={mdxComponents}>
        {definition.markdownDescription}
      </MDX>
    );
  }

  return <P>{definition.description}</P>;
}
