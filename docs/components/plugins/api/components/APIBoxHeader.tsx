import { MONOSPACE } from '~/ui/components/Text';

import { CommentData } from '../APIDataTypes';
import { getTagNamesList, H3Code } from '../APISectionUtils';
import { APISectionPlatformTags } from './APISectionPlatformTags';

type Props = {
  name: string;
  comment?: CommentData;
};

export function APIBoxHeader({ name, comment }: Props) {
  return (
    <div className="flex flex-wrap justify-between max-md-gutters:flex-col">
      <H3Code tags={getTagNamesList(comment)}>
        <MONOSPACE weight="medium" className="!wrap-anywhere !text-base">
          {name}
        </MONOSPACE>
      </H3Code>
      <APISectionPlatformTags comment={comment} />
    </div>
  );
}
