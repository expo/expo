import { mergeClasses } from '@expo/styleguide';

import { type MethodParamData } from '~/components/plugins/api/APIDataTypes';
import { resolveTypeName } from '~/components/plugins/api/APISectionUtils';
import { APICommentTextBlock } from '~/components/plugins/api/components/APICommentTextBlock';
import { MONOSPACE } from '~/ui/components/Text';

type Props = {
  param: MethodParamData;
  sdkVersion: string;
  className?: string;
};

export function APIParamDetailsBlock({ param, sdkVersion, className }: Props) {
  if (!param.comment) {
    return null;
  }

  return (
    <div
      className={mergeClasses(
        'flex flex-col gap-0.5 border-l-2 border-secondary pl-2.5 text-xs text-secondary',
        className
      )}
      key={param.name}>
      <MONOSPACE>
        {param.name}
        <span className="text-quaternary">:</span> {resolveTypeName(param.type, sdkVersion)}
      </MONOSPACE>
      <APICommentTextBlock comment={param.comment} />
    </div>
  );
}
