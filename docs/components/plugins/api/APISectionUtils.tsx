import { mergeClasses } from '@expo/styleguide';
import { slug } from 'github-slugger';
import { type ComponentType, type PropsWithChildren } from 'react';
import { type Components } from 'react-markdown';

import { HeadingType } from '~/common/headingManager';
import { Code as PrismCodeBlock } from '~/components/base/code';
import { Callout } from '~/ui/components/Callout';
import { HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import {
  A,
  BOLD,
  CODE,
  H4,
  LI,
  OL,
  P,
  RawH3,
  UL,
  createPermalinkedComponent,
  DEMI,
  CALLOUT,
  createTextComponent,
  SPAN,
} from '~/ui/components/Text';
import { TextElement } from '~/ui/components/Text/types';

import {
  CommentContentData,
  CommentData,
  DefaultPropsDefinitionData,
  MethodDefinitionData,
  MethodParamData,
  MethodSignatureData,
  PropData,
  TypeDefinitionData,
  TypeDocKind,
  TypeParameterData,
  TypePropertyDataFlags,
  TypeSignaturesData,
} from './APIDataTypes';
import { APIParamRow } from './components/APIParamRow';
import { ELEMENT_SPACING, STYLES_OPTIONAL } from './styles';

const isDev = process.env.NODE_ENV === 'development';

export const DEFAULT_BASE_NESTING_LEVEL = 2;

export type MDComponents = Components;
export type CodeComponentProps = PropsWithChildren<{
  className?: string;
  node: { data?: { meta?: string } };
}>;

const getInvalidLinkMessage = (href: string) =>
  `Using "../" when linking other packages in doc comments produce a broken link! Please use "./" instead. Problematic link:\n\t${href}`;

export const mdComponents: MDComponents = {
  blockquote: ({ children }) => <Callout size="sm">{children}</Callout>,
  code: ({ className, children, node }: CodeComponentProps) => {
    return className ? (
      <PrismCodeBlock className={className} title={node?.data?.meta}>
        {children}
      </PrismCodeBlock>
    ) : (
      <CODE className="!inline">{children}</CODE>
    );
  },
  pre: ({ children }) => <>{children}</>,
  h1: ({ children }) => <H4 hideInSidebar>{children}</H4>,
  ul: ({ children }) => <UL className={ELEMENT_SPACING}>{children}</UL>,
  ol: ({ children }) => <OL className={ELEMENT_SPACING}>{children}</OL>,
  li: ({ children }) => <LI>{children}</LI>,
  a: ({ href, children }) => {
    if (
      href?.startsWith('../') &&
      !href?.startsWith('../..') &&
      !href?.startsWith('../react-native')
    ) {
      if (isDev) {
        throw new Error(getInvalidLinkMessage(href));
      } else {
        console.warn(getInvalidLinkMessage(href));
      }
    }
    return <A href={href}>{children}</A>;
  },
  p: ({ children }) => (children ? <P className={ELEMENT_SPACING}>{children}</P> : null),
  strong: ({ children }) => <BOLD>{children}</BOLD>,
  span: ({ children }) => (children ? <span>{children}</span> : null),
  table: ({ children }) => <Table>{children}</Table>,
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tr: ({ children }) => <Row>{children}</Row>,
  th: ({ children }) => <HeaderCell>{children}</HeaderCell>,
  sup: ({ children }) => <sup>{children}</sup>,
  sub: ({ children }) => <sub>{children}</sub>,
};

export const mdComponentsNoValidation: MDComponents = {
  ...mdComponents,
  a: ({ href, children }) => <A href={href}>{children}</A>,
};

const nonLinkableTypes = [
  'B',
  'BufferSource',
  'CodedError',
  'ColorValue',
  'ComponentClass',
  'ComponentProps',
  'ComponentType',
  'E',
  'EmitterSubscription',
  'EventName',
  'EventSubscription',
  'ForwardRefExoticComponent',
  'GeneratedHref',
  'GestureResponderEvent',
  'GetPermissionMethod',
  'InferEventParameter',
  'K',
  'Listener',
  'ModuleType',
  'NativeSyntheticEvent',
  'NavigationContainerRefWithCurrent',
  'NotificationTimeoutError',
  'Options',
  'P',
  'Parameters',
  'ParamListBase',
  'ParsedQs',
  'PartialState',
  'PermissionHookBehavior',
  'PropsWithChildren',
  'PropsWithoutRef',
  'ProxyNativeModule',
  'React.FC',
  'RequestPermissionMethod',
  'RouteParamInput',
  'RouteParams',
  'ScreenListeners',
  'ServiceActionResult',
  'StyleProp',
  'T',
  'TaskOptions',
  'TEventListener',
  'TEventMap',
  'TEventName',
  'TEventsMap',
  'TInitialValue',
  'TOptions',
  'TParams',
  'TRoute',
  'TState',
];

/**
 * List of type names that should not be visible in the docs.
 */
const omittableTypes = [
  // Internal React type that adds `ref` prop to the component
  'RefAttributes',
];

/**
 * Map of internal entity/type names that should be replaced with something more developer-friendly.
 */
const replaceableTypes: Partial<Record<string, string>> = {
  ForwardRefExoticComponent: 'Component',
  LocationAccuracy: 'Accuracy',
  LocationGeofencingRegionState: 'GeofencingRegionState',
  LocationActivityType: 'ActivityType',
};

/**
 * Map of entity/type names that should be linked to user specified source, internal or external.
 */
const hardcodedTypeLinks: Record<string, string> = {
  ArrayBuffer:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer',
  Asset: '/versions/latest/sdk/asset/#asset',
  AsyncIterableIterator:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator',
  AVMetadata: '/versions/latest/sdk/av/#avmetadata',
  AVPlaybackSource: '/versions/latest/sdk/av/#avplaybacksource',
  AVPlaybackStatus: '/versions/latest/sdk/av/#avplaybackstatus',
  AVPlaybackStatusToSet: '/versions/latest/sdk/av/#avplaybackstatustoset',
  AudioSampleCallback: '/versions/latest/sdk/av/#avplaybackstatustoset',
  Blob: 'https://developer.mozilla.org/en-US/docs/Web/API/Blob',
  Component: 'https://react.dev/reference/react/Component',
  CreateURLOptions: '/versions/latest/sdk/linking/#createurloptions',
  Date: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date',
  DeviceSensor: '/versions/latest/sdk/sensors',
  Element: 'https://www.typescriptlang.org/docs/handbook/jsx.html#function-component',
  Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
  Exclude:
    'https://www.typescriptlang.org/docs/handbook/utility-types.html#excludeuniontype-excludedmembers',
  ExpoConfig:
    'https://github.com/expo/expo/blob/main/packages/%40expo/config-types/src/ExpoConfig.ts',
  Extract: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#extracttype-union',
  // Conflicts with the File class from expo-file-system@next. TODO: Fix this.
  // File: 'https://developer.mozilla.org/en-US/docs/Web/API/File',
  FileList: 'https://developer.mozilla.org/en-US/docs/Web/API/FileList',
  HTMLAnchorElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement',
  HTMLInputElement: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement',
  IterableIterator:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator',
  MediaTrackSettings: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSettings',
  MessageEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent',
  MouseEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent',
  NavigationContainerRef:
    'https://reactnavigation.org/docs/typescript/#annotating-ref-on-navigationcontainer',
  NavigationOptions: 'https://reactnavigation.org/docs/screen-options/',
  NavigationState: 'https://reactnavigation.org/docs/navigation-state',
  Omit: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys',
  PackagerAsset: 'https://github.com/facebook/react-native/blob/main/packages/assets/registry.js',
  Pick: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys',
  Partial: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype',
  Platform: 'https://reactnative.dev/docs/platform',
  Playback: '/versions/latest/sdk/av/#playback',
  Promise:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise',
  PureComponent: 'https://react.dev/reference/react/PureComponent',
  ReactNode: 'https://reactnative.dev/docs/react-node',
  Readonly: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype',
  Required: 'https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredtype',
  RouteProp: 'https://reactnavigation.org/docs/glossary-of-terms/#route-prop',
  RootParamList:
    'https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc',
  SFSymbol: 'https://github.com/nandorojo/sf-symbols-typescript',
  ShareOptions: 'https://reactnative.dev/docs/share#share',
  SpeechSynthesisEvent: 'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisEvent',
  SpeechSynthesisUtterance:
    'https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance',
  SyntheticEvent: 'https://react.dev/reference/react-dom/components/common#react-event-object',
  TextProps: 'https://reactnative.dev/docs/text#props',
  Uint8Array:
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array',
  View: 'https://reactnative.dev/docs/view',
  ViewProps: 'https://reactnative.dev/docs/view#props',
  ViewStyle: 'https://reactnative.dev/docs/view-style-props',
  WebBrowserOpenOptions: '/versions/latest/sdk/webbrowser/#webbrowseropenoptions',
  WebBrowserWindowFeatures: '/versions/latest/sdk/webbrowser/#webbrowserwindowfeatures',
  WebGL2RenderingContext: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext',
  WebGLFramebuffer: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer',
  WebGLTexture: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLTexture',
};

const sdkVersionHardcodedTypeLinks: Record<string, Record<string, string | null>> = {
  'v49.0.0': {
    Manifest: '/versions/v49.0.0/sdk/constants/#manifest',
    SharedObject: null,
  },
  'v50.0.0': {
    SharedObject: null,
  },
  '51.0.0': {
    SharedObject: null,
  },
  'v52.0.0': {
    EventEmitter: '/versions/v52.0.0/sdk/expo/#eventemitter',
    NativeModule: '/versions/v52.0.0/sdk/expo/#nativemodule',
    SharedObject: '/versions/v52.0.0/sdk/expo/#sharedobject',
    SharedRef: '/versions/v52.0.0/sdk/expo/#sharedref',
    BufferOptions: '/versions/v52.0.0/sdk/video/#bufferoptions-1',
  },
  'v53.0.0': {
    EventEmitter: '/versions/v53.0.0/sdk/expo/#eventemitter',
    NativeModule: '/versions/v53.0.0/sdk/expo/#nativemodule',
    SharedObject: '/versions/v53.0.0/sdk/expo/#sharedobject',
    SharedRef: '/versions/v53.0.0/sdk/expo/#sharedref',
  },
  latest: {
    EventEmitter: '/versions/latest/sdk/expo/#eventemitter',
    NativeModule: '/versions/latest/sdk/expo/#nativemodule',
    SharedObject: '/versions/latest/sdk/expo/#sharedobject',
    SharedRef: '/versions/latest/sdk/expo/#sharedref',
  },
  unversioned: {
    EventEmitter: '/versions/unversioned/sdk/expo/#eventemitter',
    NativeModule: '/versions/unversioned/sdk/expo/#nativemodule',
    SharedObject: '/versions/unversioned/sdk/expo/#sharedobject',
    SharedRef: '/versions/unversioned/sdk/expo/#sharedref',
    Href: '/versions/unversioned/sdk/router/#href-1',
    BufferOptions: '/versions/unversioned/sdk/video/#bufferoptions-1',
  },
};

const packageLinks: Record<string, string> = {
  'expo-manifests': 'manifests',
};

const renderWithLink = ({
  name,
  type,
  typePackage,
  sdkVersion,
}: {
  name: string;
  type?: string;
  typePackage?: string;
  sdkVersion: string;
}) => {
  const replacedName = replaceableTypes[name] ?? name;

  if (name.includes('.')) {
    return name;
  }

  if (typePackage && packageLinks[typePackage]) {
    return (
      <A
        href={`${packageLinks[typePackage]}/#${replacedName.toLowerCase()}`}
        key={`type-link-${replacedName}`}>
        {replacedName}
        {type === 'array' && '[]'}
      </A>
    );
  }

  const hardcodedHref =
    sdkVersionHardcodedTypeLinks[sdkVersion]?.[replacedName] ?? hardcodedTypeLinks[replacedName];

  if (hardcodedHref || !nonLinkableTypes.includes(replacedName)) {
    return (
      <A href={hardcodedHref ?? `#${replacedName.toLowerCase()}`} key={`type-link-${replacedName}`}>
        {replacedName}
        {type === 'array' && '[]'}
      </A>
    );
  }

  return replacedName + (type === 'array' ? '[]' : '');
};

const renderUnion = (types: TypeDefinitionData[], { sdkVersion }: { sdkVersion: string }) =>
  types
    .map(type => resolveTypeName(type, sdkVersion))
    .map((valueToRender, index) => (
      <span key={`union-type-${index}`}>
        {valueToRender}
        {index + 1 !== types.length && <span className="text-quaternary"> | </span>}
      </span>
    ));

export const resolveTypeName = (
  typeDefinition: TypeDefinitionData,
  sdkVersion: string
): string | JSX.Element | (string | JSX.Element)[] => {
  if (!typeDefinition) {
    return 'undefined';
  }

  const {
    element,
    elements,
    elementType,
    name,
    type,
    types,
    typeArguments,
    declaration,
    value,
    queryType,
    operator,
    objectType,
    indexType,
    target,
  } = typeDefinition;

  try {
    if (name) {
      if (type === 'reference') {
        if (typeArguments) {
          if (name === 'Record' || name === 'React.ComponentProps') {
            return (
              <>
                {name}
                <span className="text-quaternary">{'<'}</span>
                {typeArguments.map((type, index) => (
                  <span key={`record-type-${index}`}>
                    {resolveTypeName(type, sdkVersion)}
                    {index !== typeArguments.length - 1 ? (
                      <span className="text-quaternary">, </span>
                    ) : null}
                  </span>
                ))}
                <span className="text-quaternary">{'>'}</span>
              </>
            );
          } else {
            return (
              <>
                {renderWithLink({ name, typePackage: typeDefinition.package, sdkVersion })}
                <span className="text-quaternary">{'<'}</span>
                {typeArguments.map((type, index) => (
                  <span key={`${name}-nested-type-${index}`}>
                    {resolveTypeName(type, sdkVersion)}
                    {index !== typeArguments.length - 1 ? (
                      <span className="text-quaternary">, </span>
                    ) : null}
                  </span>
                ))}
                <span className="text-quaternary">{'>'}</span>
              </>
            );
          }
        } else {
          return renderWithLink({ name, typePackage: typeDefinition.package, sdkVersion });
        }
      } else if (type === 'namedTupleMember' && element) {
        return `${name}: ${element.name}`;
      } else {
        return name;
      }
    } else if (elementType?.name) {
      if (elementType.type === 'reference') {
        return renderWithLink({
          name: elementType.name,
          type,
          typePackage: typeDefinition.package,
          sdkVersion,
        });
      } else if (type === 'array') {
        return elementType.name + '[]';
      }
      return elementType.name + type;
    } else if (elementType?.declaration) {
      if (type === 'array') {
        const { parameters, type: paramType } = elementType.declaration.indexSignature ?? {};
        if (parameters && paramType) {
          return (
            <>
              <span className="text-quaternary">{'{'}</span>
              {` [${listParams(parameters)}]: ${resolveTypeName(paramType, sdkVersion)} `}
              <span className="text-quaternary">{'}'}</span>
            </>
          );
        }
      }
      return elementType.name + type;
    } else if (type === 'union' && types?.length) {
      return renderUnion(types, { sdkVersion });
    } else if (elementType && elementType.type === 'union' && elementType?.types?.length) {
      const unionTypes = elementType?.types ?? [];
      return (
        <>
          <span className="text-quaternary">(</span>
          {renderUnion(unionTypes, { sdkVersion })}
          <span className="text-quaternary">)</span>
          {type === 'array' && <span className="text-quaternary">[]</span>}
        </>
      );
    } else if (declaration?.signatures) {
      const baseSignature = declaration.signatures[0];
      if (baseSignature?.parameters?.length) {
        return (
          <>
            <span className="text-quaternary">(</span>
            {baseSignature.parameters?.map((param, index) => (
              <span key={`param-${index}-${param.name}`}>
                {param.name}
                <span className="text-quaternary">:</span> {resolveTypeName(param.type, sdkVersion)}
                {index + 1 !== baseSignature.parameters?.length && (
                  <span className="text-quaternary">, </span>
                )}
              </span>
            ))}
            <span className="text-quaternary">{') =>'}</span>{' '}
            {baseSignature.type ? resolveTypeName(baseSignature.type, sdkVersion) : 'undefined'}
          </>
        );
      } else {
        return (
          <>
            <span className="text-quaternary">{'() =>'}</span>{' '}
            {baseSignature.type ? resolveTypeName(baseSignature.type, sdkVersion) : 'undefined'}
          </>
        );
      }
    } else if (type === 'reflection' && declaration?.children) {
      return (
        <>
          <span className="text-quaternary">{'{\n'}</span>
          {declaration?.children.map((child: PropData, i) => (
            <span key={`reflection-${name}-${i}`}>
              {'  '}
              {child.name + ': '}
              {resolveTypeName(child.type, sdkVersion)}
              {i + 1 !== declaration?.children?.length ? ', ' : null}
              {'\n'}
            </span>
          ))}
          <span className="text-quaternary">{'}'}</span>
        </>
      );
    } else if (type === 'tuple' && elements) {
      return (
        <>
          <span className="text-quaternary">[</span>
          {elements.map((elem, i) => (
            <span key={`tuple-${name}-${i}`}>
              {resolveTypeName(elem, sdkVersion)}
              {i + 1 !== elements.length ? <span className="text-quaternary">, </span> : null}
            </span>
          ))}
          <span className="text-quaternary">]</span>
        </>
      );
    } else if (type === 'query' && queryType) {
      return queryType.name;
    } else if (type === 'literal' && typeof value === 'boolean') {
      return `${value}`;
    } else if (type === 'literal' && (value || (typeof value === 'number' && value === 0))) {
      return `'${value}'`;
    } else if (type === 'intersection' && types) {
      return types
        .filter(({ name }) => !omittableTypes.includes(name ?? ''))
        .map((value, index, array) => (
          <span key={`intersection-${name}-${index}`}>
            {resolveTypeName(value, sdkVersion)}
            {index + 1 !== array.length && ' & '}
          </span>
        ));
    } else if (type === 'indexedAccess') {
      if (indexType?.name) {
        return `${objectType?.name}[${indexType?.name}]`;
      }
      return `${objectType?.name}['${indexType?.value}']`;
    } else if (type === 'typeOperator') {
      if (target && operator && ['readonly', 'keyof'].includes(operator)) {
        return (
          <>
            {operator} {resolveTypeName(target, sdkVersion)}
          </>
        );
      }
      return operator ?? 'undefined';
    } else if (type === 'intrinsic') {
      return name ?? 'undefined';
    } else if (type === 'rest' && elementType) {
      return `...${resolveTypeName(elementType, sdkVersion)}`;
    } else if (value === null) {
      return 'null';
    }
    return 'undefined';
  } catch (error) {
    console.warn('Type resolve has failed!', error);
    return 'undefined';
  }
};

export const parseParamName = (name: string) => (name.startsWith('__') ? name.substr(2) : name);

export const ParamsTableHeadRow = ({ hasDescription = true, mainCellLabel = 'Name' }) => (
  <TableHead>
    <Row>
      <HeaderCell size="sm">{mainCellLabel}</HeaderCell>
      <HeaderCell size="sm">Type</HeaderCell>
      {hasDescription && <HeaderCell size="sm">Description</HeaderCell>}
    </Row>
  </TableHead>
);

function createInheritPermalink(baseNestingLevel: number) {
  return createPermalinkedComponent(createTextComponent(TextElement.SPAN, 'text-inherit'), {
    baseNestingLevel,
  });
}

export const BoxSectionHeader = ({
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
        '-mx-5 my-4 flex border-y border-secondary bg-subtle px-5 py-2',
        'max-lg-gutters:-mx-4',
        className
      )}>
      <TextWrapper className="flex flex-row items-center gap-2 font-medium text-tertiary">
        {Icon && <Icon className="icon-sm text-icon-secondary" />}
        {text}
      </TextWrapper>
    </CALLOUT>
  );
};

export const renderParams = (parameters: MethodParamData[], sdkVersion: string) => {
  const hasDescription = Boolean(parameters.some(param => param.comment));
  return (
    <Table>
      <ParamsTableHeadRow hasDescription={hasDescription} mainCellLabel="Parameter" />
      <tbody>
        {parameters?.map(p => (
          <APIParamRow
            key={p.name}
            param={p}
            sdkVersion={sdkVersion}
            showDescription={hasDescription}
          />
        ))}
      </tbody>
    </Table>
  );
};

export const listParams = (parameters: MethodParamData[]) =>
  parameters
    ? parameters
        ?.map(param => {
          if (param.flags?.isRest) {
            return `...${parseParamName(param.name)}`;
          }
          return parseParamName(param.name);
        })
        .join(', ')
    : '';

export const renderDefaultValue = (defaultValue?: string) =>
  defaultValue && defaultValue !== '...' ? (
    <div className="flex items-start gap-1">
      <DEMI theme="secondary">Default:</DEMI>
      <CODE className="!text-[90%]">{defaultValue}</CODE>
    </div>
  ) : undefined;

export const renderFlags = (flags?: TypePropertyDataFlags, defaultValue?: string) =>
  (flags?.isOptional || defaultValue) && (
    <>
      <br />
      <span className={STYLES_OPTIONAL}>(optional)</span>
    </>
  );

export const renderIndexSignature = (kind: TypeDocKind) =>
  kind === TypeDocKind.Parameter && (
    <>
      <br />
      <A
        className={STYLES_OPTIONAL}
        href="https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures"
        openInNewTab
        isStyled>
        (index signature)
      </A>
    </>
  );

export type CommentTextBlockProps = {
  comment?: CommentData;
  components?: MDComponents;
  beforeContent?: JSX.Element;
  afterContent?: JSX.Element;
  includePlatforms?: boolean;
  inlineHeaders?: boolean;
  emptyCommentFallback?: string;
};

export const parseCommentContent = (content?: string): string =>
  content?.length ? content.replace(/&ast;/g, '*').replace(/\t/g, '') : '';

export const getCommentOrSignatureComment = (
  comment?: CommentData,
  signatures?: MethodSignatureData[] | TypeSignaturesData[]
) => comment ?? signatures?.[0]?.comment;

export const getTagData = (tagName: string, comment?: CommentData) =>
  getAllTagData(tagName, comment)?.[0];

export const getAllTagData = (tagName: string, comment?: CommentData) =>
  [...(comment?.blockTags ?? []), ...(comment?.modifierTags ?? [])]
    .map(tag => {
      if (typeof tag === 'string') {
        return {
          tag,
          content: [
            {
              text: tag.substring(1),
              tag,
            } as CommentContentData,
          ],
        };
      } else if (tag.content.length === 0 && tag.name) {
        return {
          tag: tag.tag,
          content: [
            {
              kind: 'text',
              text: '`' + tag.name + '`',
            } as CommentContentData,
          ],
        };
      }
      return tag;
    })
    .filter(tag => tag.tag.substring(1) === tagName);

export const getTagNamesList = (comment?: CommentData) =>
  comment && [
    ...(getAllTagData('platform', comment)?.map(platformData =>
      getCommentContent(platformData.content)
    ) || []),
    ...(getTagData('deprecated', comment) ? ['deprecated'] : []),
    ...(getTagData('experimental', comment) ? ['experimental'] : []),
  ];

export function getTypeParametersNames(typeParameters?: TypeParameterData[]) {
  if (typeParameters?.length) {
    return `<${typeParameters.map(param => param.name).join(', ')}>`;
  }
  return '';
}

export const getMethodName = (
  method: MethodDefinitionData,
  apiName?: string,
  name?: string,
  parameters?: MethodParamData[],
  typeParameters?: TypeParameterData[]
) => {
  const isProperty = method.kind === TypeDocKind.Property && !parameters?.length;
  const methodName =
    ((apiName && `${apiName}.`) ?? '') +
    (method.name || name) +
    getTypeParametersNames(typeParameters);

  if (!isProperty) {
    return `${methodName}(${parameters ? listParams(parameters) : ''})`;
  }

  return methodName;
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const getCommentContent = (content: CommentContentData[]) => {
  return content
    .map(entry => {
      if (entry.tag === '@link' && !entry.text.includes('/')) {
        return `[${entry.tsLinkText?.length ? entry.tsLinkText : entry.text}](#${slug(entry.text)})`;
      }
      return entry.text;
    })
    .join('')
    .trim();
};

const getMonospaceHeader = (element: ComponentType<any>, baseNestingLevel: number) => {
  return createPermalinkedComponent(element, {
    baseNestingLevel,
    sidebarType: HeadingType.INLINE_CODE,
  });
};

export function getH3CodeWithBaseNestingLevel(baseNestingLevel: number) {
  return getMonospaceHeader(RawH3, baseNestingLevel);
}
export const H3Code = getH3CodeWithBaseNestingLevel(3);

export const getComponentName = (name?: string, children: PropData[] = []) => {
  if (name && name !== 'default') {
    return name;
  }
  const ctor = children.filter((child: PropData) => child.name === 'constructor')[0];
  return ctor?.signatures?.[0]?.type?.name ?? 'default';
};

export function getPossibleComponentPropsNames(name?: string, children: PropData[] = []) {
  const componentName = getComponentName(name, children);
  return [`${componentName}Props`, `${componentName.replace('View', '')}Props`];
}

export function extractDefaultPropValue(
  { comment, name }: PropData,
  defaultProps?: DefaultPropsDefinitionData
) {
  const annotationDefault = getTagData('default', comment);
  if (annotationDefault) {
    return getCommentContent(annotationDefault.content);
  }
  return defaultProps?.type?.declaration?.children?.filter(
    (defaultProp: PropData) => defaultProp.name === name
  )[0]?.defaultValue;
}
