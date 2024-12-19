import { mergeClasses } from '@expo/styleguide';
import { CornerDownRightIcon } from '@expo/styleguide-icons/outline/CornerDownRightIcon';
import ReactMarkdown from 'react-markdown';

import { APIBoxSectionHeader } from '~/components/plugins/api/components/APIBoxSectionHeader';
import { H2, CODE, MONOSPACE, CALLOUT, SPAN } from '~/ui/components/Text';

import { ClassDefinitionData, GeneratedData, PropData, TypeDocKind } from './APIDataTypes';
import { APISectionDeprecationNote } from './APISectionDeprecationNote';
import { renderMethod } from './APISectionMethods';
import { renderProp } from './APISectionProps';
import {
  H3Code,
  getTagData,
  getTagNamesList,
  mdComponents,
  resolveTypeName,
  getCommentContent,
  DEFAULT_BASE_NESTING_LEVEL,
  extractDefaultPropValue,
} from './APISectionUtils';
import { APICommentTextBlock } from './components/APICommentTextBlock';
import { APISectionPlatformTags } from './components/APISectionPlatformTags';
import { STYLES_APIBOX, STYLES_APIBOX_NESTED, STYLES_SECONDARY } from './styles';

export type APISectionClassesProps = {
  data: GeneratedData[];
  sdkVersion: string;
};

const CLASS_NAMES_MAP: Record<string, string> = {
  AccelerometerSensor: 'Accelerometer',
  BarometerSensor: 'Barometer',
  DeviceMotionSensor: 'DeviceMotion',
  GyroscopeSensor: 'Gyroscope',
  MagnetometerSensor: 'Magnetometer',
} as const;

const CLASSES_TO_IGNORE_INHERITED_PROPS = [
  'EventEmitter',
  'NativeModule',
  'SharedObject',
  'SharedRef',
] as const;

const isProp = (child: PropData) =>
  child.kind &&
  [TypeDocKind.Property, TypeDocKind.Accessor].includes(child.kind) &&
  !child.overwrites &&
  !child.name.startsWith('_') &&
  !child.implementationOf;

const isMethod = (child: PropData, allowOverwrites: boolean = false) =>
  child.kind &&
  [TypeDocKind.Method, TypeDocKind.Function].includes(child.kind) &&
  (allowOverwrites || !child.overwrites) &&
  !child.name.startsWith('_') &&
  !child?.implementationOf;

// This is intended to filter out inherited properties from some
// common classes that are documented inside the `expo` package docs.
const isInheritedFromCommonClass = (child: PropData) =>
  child.inheritedFrom?.type === 'reference' &&
  CLASSES_TO_IGNORE_INHERITED_PROPS.some(className =>
    child.inheritedFrom?.name.startsWith(`${className}.`)
  );

const remapClass = (clx: ClassDefinitionData) => {
  clx.isSensor = !!CLASS_NAMES_MAP[clx.name] || Object.values(CLASS_NAMES_MAP).includes(clx.name);
  clx.name = CLASS_NAMES_MAP[clx.name] ?? clx.name;

  if (clx.isSensor && clx.extendedTypes) {
    clx.extendedTypes = clx.extendedTypes.map(type => ({
      ...type,
      name: type.name === 'default' ? 'DeviceSensor' : type.name,
    }));
  }

  return clx;
};

const renderClass = (
  { name, comment, type, extendedTypes, children, implementedTypes, isSensor }: ClassDefinitionData,
  sdkVersion: string
): JSX.Element => {
  const properties = children?.filter(isProp);
  const methods = children
    ?.filter(child => isMethod(child, isSensor) && !isInheritedFromCommonClass(child))
    .sort((a: PropData, b: PropData) => a.name.localeCompare(b.name));
  const returnComment = getTagData('returns', comment);

  const linksNestingLevel = DEFAULT_BASE_NESTING_LEVEL + 2;

  return (
    <div
      key={`class-definition-${name}`}
      className={mergeClasses(STYLES_APIBOX, STYLES_APIBOX_NESTED)}>
      <APISectionDeprecationNote comment={comment} sticky />
      <div className="flex flex-wrap justify-between max-md-gutters:flex-col">
        <H3Code tags={getTagNamesList(comment)}>
          <MONOSPACE weight="medium" className="wrap-anywhere">
            {name}
          </MONOSPACE>
        </H3Code>
        <APISectionPlatformTags comment={comment} />
      </div>
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
      <APICommentTextBlock
        comment={comment}
        includePlatforms={false}
        afterContent={
          returnComment && (
            <div className="flex flex-col items-start gap-2">
              <div className="flex flex-row items-center gap-2">
                <CornerDownRightIcon className="icon-sm relative -mt-0.5 inline-block text-icon-tertiary" />
                <span className={STYLES_SECONDARY}>Returns</span>
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
          <APIBoxSectionHeader
            text={`${name} Properties`}
            exposeInSidebar={false}
            baseNestingLevel={DEFAULT_BASE_NESTING_LEVEL + 2}
          />
          <div>
            {properties.map(property =>
              renderProp(
                property,
                sdkVersion,
                extractDefaultPropValue(property) ?? property?.defaultValue,
                {
                  exposeInSidebar: true,
                  baseNestingLevel: linksNestingLevel,
                }
              )
            )}
          </div>
        </>
      ) : null}
      {methods?.length > 0 && (
        <>
          <APIBoxSectionHeader
            text={`${name} Methods`}
            exposeInSidebar={false}
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
    return (
      <>
        <H2>Classes</H2>
        {data.map(clx => renderClass(remapClass(clx), sdkVersion))}
      </>
    );
  }
  return null;
};

export default APISectionClasses;
