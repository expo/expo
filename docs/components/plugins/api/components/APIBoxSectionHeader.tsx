import { mergeClasses } from '@expo/styleguide';
import type { ComponentType } from 'react';

import {
  CALLOUT,
  createPermalinkedComponent,
  createTextComponent,
  SPAN,
} from '~/ui/components/Text';
import { TextElement } from '~/ui/components/Text/types';

import { DEFAULT_BASE_NESTING_LEVEL } from '../APISectionUtils';

export const APIBoxSectionHeader = ({
  text,
  Icon,
  exposeInSidebar,
  className,
  baseNestingLevel = DEFAULT_BASE_NESTING_LEVEL,
}: {
  text: string;
  Icon?: ComponentType<any>;
  exposeInSidebar?: boolean;
  className?: string;
  baseNestingLevel?: number;
}) => {
  const TextWrapper = exposeInSidebar ? createInheritPermalink(baseNestingLevel) : SPAN;
  return (
    <CALLOUT
      className={mergeClasses(
        'border-palette-gray4 bg-subtle text-2xs text-tertiary flex border-y px-4 py-2 font-medium',
        className
      )}>
      <TextWrapper className="text-2xs text-tertiary flex flex-row items-center gap-2 font-medium">
        {Icon && <Icon className="icon-sm text-icon-secondary" />}
        {text}
      </TextWrapper>
    </CALLOUT>
  );
};

function createInheritPermalink(baseNestingLevel: number) {
  return createPermalinkedComponent(
    createTextComponent(TextElement.SPAN, 'text-inherit inline-flex items-center'),
    {
      baseNestingLevel,
    }
  );
}
