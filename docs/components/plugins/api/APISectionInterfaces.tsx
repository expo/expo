import { mergeClasses } from '@expo/styleguide';

import { Cell, Row, Table } from '~/ui/components/Table';
import { H2, CALLOUT, CODE, DEMI } from '~/ui/components/Text';

import {
  CommentData,
  InterfaceDefinitionData,
  MethodSignatureData,
  PropData,
} from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { renderMethod } from './APISectionMethods';
import {
  getTagData,
  parseCommentContent,
  renderFlags,
  resolveTypeName,
  renderDefaultValue,
  getCommentContent,
} from './APISectionUtils';
import { APIBoxHeader } from './components/APIBoxHeader';
import { APIBoxSectionHeader } from './components/APIBoxSectionHeader';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APIDataType } from './components/APIDataType';
import { APIParamRow } from './components/APIParamRow';
import { APIParamsTableHeadRow } from './components/APIParamsTableHeadRow';
import { ELEMENT_SPACING, STYLES_APIBOX, STYLES_APIBOX_NESTED, STYLES_SECONDARY } from './styles';

export type APISectionInterfacesProps = {
  data: InterfaceDefinitionData[];
  sdkVersion: string;
};

const renderInterfaceComment = (
  sdkVersion: string,
  comment?: CommentData,
  signatures?: MethodSignatureData[],
  defaultValue?: string
) => {
  if (signatures?.length) {
    const { type, parameters, comment: signatureComment } = signatures[0];
    const defaultTag = getTagData('default', signatureComment);
    const initValue =
      defaultValue ?? (defaultTag ? getCommentContent(defaultTag.content) : undefined);
    return (
      <>
        {parameters?.length
          ? parameters.map(param => (
              <APIParamRow key={param.name} param={param} sdkVersion={sdkVersion} />
            ))
          : null}
        <DEMI>Returns</DEMI>
        <CODE>{resolveTypeName(type, sdkVersion)}</CODE>
        {signatureComment && (
          <>
            <br />
            <APISectionDeprecationNote comment={comment} />
            <APICommentTextBlock
              inlineHeaders
              comment={signatureComment}
              afterContent={renderDefaultValue(initValue)}
            />
          </>
        )}
      </>
    );
  } else {
    const defaultTag = getTagData('default', comment);
    const initValue =
      defaultValue ?? (defaultTag ? getCommentContent(defaultTag.content) : undefined);
    return (
      <>
        <APISectionDeprecationNote comment={comment} />
        <APICommentTextBlock
          inlineHeaders
          comment={comment}
          afterContent={renderDefaultValue(initValue)}
          emptyCommentFallback={getTagData('deprecated', comment) ? '' : '-'}
        />
      </>
    );
  }
};

const renderInterfacePropertyRow = (
  { name, flags, type, comment, signatures, defaultValue }: PropData,
  sdkVersion: string
): JSX.Element => {
  const defaultTag = getTagData('default', comment);
  const initValue = parseCommentContent(
    defaultValue ?? (defaultTag ? getCommentContent(defaultTag.content) : '')
  );
  return (
    <Row key={name}>
      <Cell>
        <DEMI>{name}</DEMI>
        {renderFlags(flags, initValue)}
      </Cell>
      <Cell>
        <APIDataType typeDefinition={type} sdkVersion={sdkVersion} />
      </Cell>
      <Cell>{renderInterfaceComment(sdkVersion, comment, signatures, initValue)}</Cell>
    </Row>
  );
};

const renderInterface = (
  { name, children, comment, extendedTypes }: InterfaceDefinitionData,
  sdkVersion: string
): JSX.Element | null => {
  const interfaceChildren = children?.filter(child => !child?.inheritedFrom) || [];

  if (!interfaceChildren.length) {
    return null;
  }

  const interfaceMethods = interfaceChildren.filter(child => child.signatures);
  const interfaceFields = interfaceChildren.filter(child => !child.signatures);

  return (
    <div
      key={`interface-definition-${name}`}
      className={mergeClasses(STYLES_APIBOX, STYLES_APIBOX_NESTED, 'overflow-hidden')}>
      <APISectionDeprecationNote comment={comment} sticky />
      <APIBoxHeader name={name} comment={comment} />
      {extendedTypes?.length ? (
        <CALLOUT className={mergeClasses(ELEMENT_SPACING, 'px-4')}>
          <span className={STYLES_SECONDARY}>Extends: </span>
          {extendedTypes.map(extendedType => (
            <CODE key={`extend-${extendedType.name}`}>
              {resolveTypeName(extendedType, sdkVersion)}
            </CODE>
          ))}
        </CALLOUT>
      ) : null}
      <APICommentTextBlock comment={comment} includePlatforms={false} />
      {interfaceFields.length > 0 && (
        <>
          <Table containerClassName="rounded-none border-0 border-t">
            <APIParamsTableHeadRow mainCellLabel="Property" />
            <tbody>
              {interfaceFields.map(field => renderInterfacePropertyRow(field, sdkVersion))}
            </tbody>
          </Table>
        </>
      )}
      {interfaceMethods.length > 0 && (
        <>
          <APIBoxSectionHeader text={`${name} Methods`} exposeInSidebar baseNestingLevel={99} />
          {interfaceMethods.map(method =>
            renderMethod(method, { exposeInSidebar: false, sdkVersion, nested: true })
          )}
        </>
      )}
    </div>
  );
};

const APISectionInterfaces = ({ data, sdkVersion }: APISectionInterfacesProps) =>
  data?.length ? (
    <>
      <H2 key="interfaces-header">Interfaces</H2>
      {data.map(entity => renderInterface(entity, sdkVersion))}
    </>
  ) : null;

export default APISectionInterfaces;
