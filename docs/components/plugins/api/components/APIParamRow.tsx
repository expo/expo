import { MethodParamData } from '~/components/plugins/api/APIDataTypes';
import {
  getCommentContent,
  getTagData,
  parseCommentContent,
  parseParamName,
  renderDefaultValue,
  renderFlags,
} from '~/components/plugins/api/APISectionUtils';
import { APICommentTextBlock } from '~/components/plugins/api/components/APICommentTextBlock';
import { APIDataType } from '~/components/plugins/api/components/APIDataType';
import { Cell, Row } from '~/ui/components/Table';
import { DEMI } from '~/ui/components/Text';

type Props = {
  param: MethodParamData;
  sdkVersion: string;
  showDescription?: boolean;
};

export function APIParamRow({
  param: { comment, name, type, flags, defaultValue },
  sdkVersion,
  showDescription,
}: Props) {
  const defaultData = getTagData('default', comment);
  const initValue = parseCommentContent(
    defaultValue ?? (defaultData ? getCommentContent(defaultData.content) : '')
  );
  return (
    <Row key={`param-${name}`}>
      <Cell>
        <DEMI>
          {flags?.isRest ? '...' : ''}
          {parseParamName(name)}
        </DEMI>
        {renderFlags(flags, initValue)}
      </Cell>
      <Cell>
        <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
      </Cell>
      {showDescription && (
        <Cell className="[&>*]:last:!mb-0">
          <APICommentTextBlock
            comment={comment}
            afterContent={renderDefaultValue(initValue)}
            emptyCommentFallback="-"
          />
        </Cell>
      )}
    </Row>
  );
}
