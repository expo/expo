import ReactMarkdown from 'react-markdown';

import {
  ClassDefinitionData,
  GeneratedData,
  PropData,
} from '~/components/plugins/api/APIDataTypes';
import { APISectionDeprecationNote } from '~/components/plugins/api/APISectionDeprecationNote';
import { renderMethod } from '~/components/plugins/api/APISectionMethods';
import { APISectionPlatformTags } from '~/components/plugins/api/APISectionPlatformTags';
import { renderProp } from '~/components/plugins/api/APISectionProps';
import {
  CommentTextBlock,
  H3Code,
  getTagData,
  getTagNamesList,
  mdComponents,
  resolveTypeName,
  STYLES_APIBOX,
  STYLES_APIBOX_NESTED,
  TypeDocKind,
  getCommentContent,
  BoxSectionHeader,
  DEFAULT_BASE_NESTING_LEVEL,
} from '~/components/plugins/api/APISectionUtils';
import { H2, P, CODE, MONOSPACE, DEMI } from '~/ui/components/Text';

export type APISectionClassesProps = {
  data: GeneratedData[];

  /**
   * Whether to expose all classes props in the sidebar.
   * @default true when `data` has only one class, false otherwise.
   *
   * > **Note:** When you have multiple classes and want to enable this option, you should also set the mdx `maxHeadingDepth` at least to 3.
   */
  exposeAllClassPropsInSidebar?: boolean;
};

const classNamesMap: Record<string, string> = {
  AccelerometerSensor: 'Accelerometer',
  BarometerSensor: 'Barometer',
  DeviceMotionSensor: 'DeviceMotion',
  GyroscopeSensor: 'Gyroscope',
  MagnetometerSensor: 'Magnetometer',
} as const;

const isProp = (child: PropData) =>
  child.kind === TypeDocKind.Property &&
  !child.overwrites &&
  !child.name.startsWith('_') &&
  !child.implementationOf;

const isMethod = (child: PropData, allowOverwrites: boolean = false) =>
  child.kind &&
  [TypeDocKind.Method, TypeDocKind.Function, TypeDocKind.Accessor].includes(child.kind) &&
  (allowOverwrites || !child.overwrites) &&
  !child.name.startsWith('_') &&
  !child?.implementationOf;

const remapClass = (clx: ClassDefinitionData) => {
  clx.isSensor = !!classNamesMap[clx.name] || Object.values(classNamesMap).includes(clx.name);
  clx.name = classNamesMap[clx.name] ?? clx.name;

  if (clx.isSensor && clx.extendedTypes) {
    clx.extendedTypes = clx.extendedTypes.map(type => ({
      ...type,
      name: type.name === 'default' ? 'DeviceSensor' : type.name,
    }));
  }

  return clx;
};

const renderClass = (
  clx: ClassDefinitionData,
  options: { exposeAllClassPropsInSidebar: boolean; baseNestingLevelForClassProps: number }
): JSX.Element => {
  const { name, comment, type, extendedTypes, children, implementedTypes, isSensor } = clx;

  const properties = children?.filter(isProp);
  const methods = children
    ?.filter(child => isMethod(child, isSensor))
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
  const returnComment = getTagData('returns', comment);

  return (
    <div key={`class-definition-${name}`} css={[STYLES_APIBOX, STYLES_APIBOX_NESTED]}>
      <APISectionDeprecationNote comment={comment} />
      <APISectionPlatformTags comment={comment} />
      <H3Code tags={getTagNamesList(comment)}>
        <MONOSPACE weight="medium" className="wrap-anywhere">
          {name}
        </MONOSPACE>
      </H3Code>
      {(extendedTypes?.length || implementedTypes?.length) && (
        <P className="mb-3">
          <DEMI theme="secondary">Type: </DEMI>
          {type ? <CODE>{resolveTypeName(type)}</CODE> : 'Class'}
          {extendedTypes?.length && (
            <>
              <span> extends </span>
              {extendedTypes.map(extendedType => (
                <CODE key={`extends-${extendedType.name}`}>{resolveTypeName(extendedType)}</CODE>
              ))}
            </>
          )}
          {implementedTypes?.length && (
            <>
              <span> implements </span>
              {implementedTypes.map(implementedType => (
                <CODE key={`implements-${implementedType.name}`}>
                  {resolveTypeName(implementedType)}
                </CODE>
              ))}
            </>
          )}
        </P>
      )}
      <CommentTextBlock comment={comment} includePlatforms={false} />
      {returnComment && (
        <>
          <BoxSectionHeader text="Returns" />
          <ReactMarkdown components={mdComponents}>
            {getCommentContent(returnComment.content)}
          </ReactMarkdown>
        </>
      )}
      {properties?.length ? (
        <>
          <BoxSectionHeader
            text={`${name} Properties`}
            exposeInSidebar={options.exposeAllClassPropsInSidebar}
            baseNestingLevel={options.baseNestingLevelForClassProps}
          />
          <div>
            {properties.map(property =>
              renderProp(property, property?.defaultValue, {
                exposeInSidebar: options.exposeAllClassPropsInSidebar,
                baseNestingLevel: options.baseNestingLevelForClassProps + 1,
              })
            )}
          </div>
        </>
      ) : null}
      {methods?.length > 0 && (
        <>
          <BoxSectionHeader
            text={`${name} Methods`}
            exposeInSidebar={options.exposeAllClassPropsInSidebar}
            baseNestingLevel={options.baseNestingLevelForClassProps}
          />
          {methods.map(method =>
            renderMethod(method, {
              exposeInSidebar: options.exposeAllClassPropsInSidebar,
              baseNestingLevel: options.baseNestingLevelForClassProps + 1,
            })
          )}
        </>
      )}
    </div>
  );
};

const APISectionClasses = ({ data, ...props }: APISectionClassesProps) => {
  if (data?.length) {
    const hasMultipleClasses = data.length > 1;
    const exposeAllClassPropsInSidebar = props.exposeAllClassPropsInSidebar ?? !hasMultipleClasses;
    const baseNestingLevelForClassProps = hasMultipleClasses
      ? DEFAULT_BASE_NESTING_LEVEL + 2
      : DEFAULT_BASE_NESTING_LEVEL;
    return (
      <>
        <H2>Classes</H2>
        {data.map(clx =>
          renderClass(remapClass(clx), {
            exposeAllClassPropsInSidebar,
            baseNestingLevelForClassProps,
          })
        )}
      </>
    );
  }
  return null;
};

export default APISectionClasses;
