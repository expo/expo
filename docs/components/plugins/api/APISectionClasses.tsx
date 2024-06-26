import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';
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
import { H2, CODE, MONOSPACE, CALLOUT, SPAN } from '~/ui/components/Text';

export type APISectionClassesProps = {
  data: GeneratedData[];
  sdkVersion: string;

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
  options: { hasOnlyOneClass: boolean },
  sdkVersion: string
): JSX.Element => {
  const { name, comment, type, extendedTypes, children, implementedTypes, isSensor } = clx;

  const properties = children?.filter(isProp);
  const methods = children
    ?.filter(child => isMethod(child, isSensor))
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
  const returnComment = getTagData('returns', comment);

  const linksNestingLevel = DEFAULT_BASE_NESTING_LEVEL + 2 + (options.hasOnlyOneClass ? 1 : 0);

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
        <CALLOUT className="mb-3">
          <SPAN theme="secondary" weight="medium">
            Type:{' '}
          </SPAN>
          {type ? (
            <CODE>{resolveTypeName(type, sdkVersion)}</CODE>
          ) : (
            <SPAN theme="secondary">Class</SPAN>
          )}
          {extendedTypes?.length && (
            <>
              <SPAN theme="secondary"> extends </SPAN>
              {extendedTypes.map(extendedType => (
                <CODE key={`extends-${extendedType.name}`}>
                  {resolveTypeName(extendedType, sdkVersion)}
                </CODE>
              ))}
            </>
          )}
          {implementedTypes?.length && (
            <>
              <SPAN theme="secondary"> implements </SPAN>
              {implementedTypes.map(implementedType => (
                <CODE key={`implements-${implementedType.name}`}>
                  {resolveTypeName(implementedType, sdkVersion)}
                </CODE>
              ))}
            </>
          )}
        </CALLOUT>
      )}
      <CommentTextBlock
        comment={comment}
        includePlatforms={false}
        afterContent={
          returnComment && (
            <div className="flex flex-col gap-2 items-start">
              <div className="flex flex-row gap-2 items-center">
                <CornerDownRightIcon className="inline-block icon-sm text-icon-secondary" />
                <CALLOUT tag="span" theme="secondary" weight="medium">
                  Returns
                </CALLOUT>
              </div>
              <ReactMarkdown components={mdComponents}>
                {getCommentContent(returnComment.content)}
              </ReactMarkdown>
            </div>
          )
        }
      />
      {properties?.length ? (
        <>
          <BoxSectionHeader
            text={`${name} Properties`}
            className="!text-secondary !font-medium"
            exposeInSidebar={options.hasOnlyOneClass}
            baseNestingLevel={DEFAULT_BASE_NESTING_LEVEL + 2}
          />
          <div>
            {properties.map(property =>
              renderProp(property, sdkVersion, property?.defaultValue, {
                exposeInSidebar: true,
                baseNestingLevel: linksNestingLevel,
              })
            )}
          </div>
        </>
      ) : null}
      {methods?.length > 0 && (
        <>
          <BoxSectionHeader
            text={`${name} Methods`}
            className="!text-secondary !font-medium !text-sm"
            exposeInSidebar={options.hasOnlyOneClass}
            baseNestingLevel={DEFAULT_BASE_NESTING_LEVEL + 2}
          />
          {methods.map(method =>
            renderMethod(method, {
              exposeInSidebar: true,
              baseNestingLevel: linksNestingLevel,
              sdkVersion,
            })
          )}
        </>
      )}
    </div>
  );
};

const APISectionClasses = ({ data, sdkVersion }: APISectionClassesProps) => {
  if (data?.length) {
    const hasOnlyOneClass = data.length === 1;
    return (
      <>
        <H2>Classes</H2>
        {data.map(clx =>
          renderClass(
            remapClass(clx),
            {
              hasOnlyOneClass,
            },
            sdkVersion
          )
        )}
      </>
    );
  }
  return null;
};

export default APISectionClasses;
