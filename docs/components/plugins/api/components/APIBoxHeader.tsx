import { mergeClasses } from '@expo/styleguide';

import { MONOSPACE, RawH3 } from '~/ui/components/Text';

import { CommentData } from '../APIDataTypes';
import { getCodeHeadingWithBaseNestingLevel, getTagNamesList } from '../APISectionUtils';
import { APISectionPlatformTags } from './APISectionPlatformTags';

type Props = {
  name: string;
  comment?: CommentData;
  baseNestingLevel?: number;
};

export function APIBoxHeader({ name, comment, baseNestingLevel = 3 }: Props) {
  const HeaderComponent = getCodeHeadingWithBaseNestingLevel(baseNestingLevel, RawH3);
  return (
    <div
      className={mergeClasses(
        'mb-2.5 flex flex-wrap justify-between px-4 pt-3',
        'max-md-gutters:flex-col max-md-gutters:gap-y-1.5',
        '[&_h3]:!mb-0'
      )}>
      <HeaderComponent tags={getTagNamesList(comment)}>
        <MONOSPACE weight="medium" className="!wrap-anywhere !text-base !leading-snug">
          {name}
        </MONOSPACE>
      </HeaderComponent>
      <APISectionPlatformTags comment={comment} className="mb-0" />
    </div>
  );
}
