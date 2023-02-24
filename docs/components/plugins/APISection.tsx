import { ClassDefinitionData, GeneratedData } from '~/components/plugins/api/APIDataTypes';
import APISectionClasses from '~/components/plugins/api/APISectionClasses';
import APISectionComponents from '~/components/plugins/api/APISectionComponents';
import APISectionConstants from '~/components/plugins/api/APISectionConstants';
import APISectionEnums from '~/components/plugins/api/APISectionEnums';
import APISectionInterfaces from '~/components/plugins/api/APISectionInterfaces';
import APISectionMethods from '~/components/plugins/api/APISectionMethods';
import APISectionNamespaces from '~/components/plugins/api/APISectionNamespaces';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import APISectionTypes from '~/components/plugins/api/APISectionTypes';
import {
  getCommentContent,
  getComponentName,
  TypeDocKind,
} from '~/components/plugins/api/APISectionUtils';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { P } from '~/ui/components/Text';

const { LATEST_VERSION } = versions;

type Props = {
  packageName: string;
  apiName?: string;
  forceVersion?: string;
  strictTypes?: boolean;
  testRequire?: any;
  headersMapping?: Record<string, string>;
};

const filterDataByKind = (
  entries: GeneratedData[] = [],
  kind: TypeDocKind | TypeDocKind[],
  additionalCondition: (entry: GeneratedData) => boolean = () => true
) =>
  entries.filter(
    (entry: GeneratedData) =>
      (Array.isArray(kind) ? kind.includes(entry.kind) : entry.kind === kind) &&
      additionalCondition(entry)
  );

const isHook = ({ name }: GeneratedData) =>
  name.startsWith('use') &&
  // note(simek): hardcode this exception until the method will be renamed
  name !== 'useSystemBrightnessAsync';

const isListener = ({ name }: GeneratedData) =>
  name.endsWith('Listener') || name.endsWith('Listeners');

const isProp = ({ name }: GeneratedData) => name.includes('Props') && name !== 'ErrorRecoveryProps';

const isComponent = ({ type, extendedTypes, signatures }: GeneratedData) => {
  if (type?.name && ['React.FC', 'ForwardRefExoticComponent'].includes(type?.name)) {
    return true;
  } else if (extendedTypes && extendedTypes.length) {
    return extendedTypes[0].name === 'Component' || extendedTypes[0].name === 'PureComponent';
  } else if (signatures && signatures.length) {
    if (
      signatures[0].type.name === 'Element' ||
      (signatures[0].type.types && signatures[0].type.types.map(t => t.name).includes('Element')) ||
      (signatures[0].parameters && signatures[0].parameters[0].name === 'props')
    ) {
      return true;
    }
  }
  return false;
};

const isConstant = ({ name, type }: GeneratedData) =>
  !['default', 'Constants', 'EventEmitter'].includes(name) &&
  !(type?.name && ['React.FC', 'ForwardRefExoticComponent'].includes(type?.name));

const hasCategoryHeader = ({ signatures }: GeneratedData): boolean =>
  (signatures &&
    signatures[0].comment?.blockTags &&
    signatures[0].comment.blockTags.length > 0 &&
    signatures[0].comment.blockTags.filter(tag => tag?.tag === '@header').length > 0) ??
  false;

const groupByHeader = (entries: GeneratedData[]) => {
  return entries.reduce((group: Record<string, GeneratedData[]>, entry) => {
    const signature = entry.signatures[0];
    const header = getCommentContent(
      signature.comment?.blockTags?.filter(tag => tag.tag === '@header')[0].content ?? []
    );
    if (header) {
      group[header] = group[header] ?? [];
      group[header].push(entry);
    }
    return group;
  }, {});
};

const renderAPI = (
  packageName: string,
  version: string = 'unversioned',
  apiName?: string,
  strictTypes: boolean = false,
  testRequire: any = undefined,
  headersMapping: Record<string, string> = {}
): JSX.Element => {
  try {
    const { children: data } = testRequire
      ? testRequire(`~/public/static/data/${version}/${packageName}.json`)
      : require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = filterDataByKind(
      data,
      TypeDocKind.Function,
      entry =>
        !isListener(entry) && !isHook(entry) && !isComponent(entry) && !hasCategoryHeader(entry)
    );
    const eventSubscriptions = filterDataByKind(
      data,
      TypeDocKind.Function,
      entry => isListener(entry) && !hasCategoryHeader(entry)
    );

    const categorizedMethods = groupByHeader(
      filterDataByKind(
        data,
        TypeDocKind.Function,
        entry => !isComponent(entry) && hasCategoryHeader(entry)
      )
    );
    const hasCategorizedMethods = Object.keys(categorizedMethods).length > 0;
    const hasHeadersMapping = Object.keys(headersMapping).length;

    const types = filterDataByKind(
      data,
      TypeDocKind.TypeAlias,
      entry =>
        !isProp(entry) &&
        !!(
          entry.type.declaration ||
          entry.type.types ||
          entry.type.type ||
          entry.type.typeArguments
        ) &&
        (strictTypes && apiName ? entry.name.startsWith(apiName) : true)
    );

    const props = filterDataByKind(
      data,
      [TypeDocKind.TypeAlias, TypeDocKind.Interface],
      entry =>
        isProp(entry) &&
        (entry.kind === TypeDocKind.TypeAlias
          ? !!(entry.type.types || entry.type.declaration?.children)
          : true)
    );
    const defaultProps = filterDataByKind(
      data
        .filter((entry: GeneratedData) => entry.kind === TypeDocKind.Class)
        .map((entry: GeneratedData) => entry.children)
        .flat(),
      TypeDocKind.Property,
      entry => entry.name === 'defaultProps'
    )[0];

    const enums = filterDataByKind(data, TypeDocKind.Enum, entry => entry.name !== 'default');
    const interfaces = filterDataByKind(
      data,
      TypeDocKind.Interface,
      entry => !entry.name.includes('Props')
    );
    const constants = filterDataByKind(data, TypeDocKind.Variable, entry => isConstant(entry));

    const components = filterDataByKind(
      data,
      [TypeDocKind.Variable, TypeDocKind.Class, TypeDocKind.Function],
      entry => isComponent(entry)
    );
    const componentsPropNames = components.map(
      ({ name, children }) => `${getComponentName(name, children)}Props`
    );
    const componentsProps = filterDataByKind(
      props,
      [TypeDocKind.TypeAlias, TypeDocKind.Interface],
      entry => componentsPropNames.includes(entry.name)
    );

    const namespaces = filterDataByKind(data, TypeDocKind.Namespace);

    const classes = filterDataByKind(
      data,
      TypeDocKind.Class,
      entry => !isComponent(entry) && entry.name !== 'default'
    );

    const componentsChildren = components
      .map((cls: ClassDefinitionData) =>
        cls.children?.filter(
          child =>
            (child?.kind === TypeDocKind.Method || child?.kind === TypeDocKind.Property) &&
            !child.inheritedFrom &&
            child.name !== 'render' &&
            // note(simek): hide unannotated "private" methods
            !child.name.startsWith('_')
        )
      )
      .flat();

    const methodsNames = methods.map(method => method.name);
    const staticMethods = componentsChildren.filter(
      // note(simek): hide duplicate exports from class components
      method =>
        method?.kind === TypeDocKind.Method &&
        method?.flags?.isStatic === true &&
        !methodsNames.includes(method.name) &&
        !isHook(method as GeneratedData)
    );
    const componentMethods = componentsChildren
      .filter(
        method =>
          method?.kind === TypeDocKind.Method &&
          method?.flags?.isStatic !== true &&
          !method?.overwrites
      )
      .filter(Boolean);

    const hooks = filterDataByKind(
      [...data, ...componentsChildren].filter(Boolean),
      [TypeDocKind.Function, TypeDocKind.Property],
      entry => isHook(entry) && !hasCategoryHeader(entry)
    );

    return (
      <>
        {hasCategorizedMethods &&
          (hasHeadersMapping
            ? Object.entries(headersMapping).map(([key, header], index) => (
                <APISectionMethods
                  data={categorizedMethods[key]}
                  header={header}
                  key={`${header}-${index}`}
                />
              ))
            : Object.entries(categorizedMethods).map(([key, data], index) => (
                <APISectionMethods data={data} header={key} key={`${key}-${index}`} />
              )))}
        <APISectionComponents data={components} componentsProps={componentsProps} />
        <APISectionMethods data={staticMethods} header="Static Methods" />
        <APISectionMethods data={componentMethods} header="Component Methods" />
        <APISectionConstants data={constants} apiName={apiName} />
        <APISectionMethods data={hooks} header="Hooks" />
        <APISectionClasses data={classes} />
        {props && !componentsProps.length ? (
          <APISectionProps data={props} defaultProps={defaultProps} />
        ) : null}
        <APISectionMethods data={methods} apiName={apiName} />
        <APISectionMethods
          data={eventSubscriptions}
          apiName={apiName}
          header="Event Subscriptions"
        />
        <APISectionNamespaces data={namespaces} />
        <APISectionInterfaces data={interfaces} />
        <APISectionTypes data={types} />
        <APISectionEnums data={enums} />
      </>
    );
  } catch {
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection = ({
  packageName,
  apiName,
  forceVersion,
  strictTypes = false,
  testRequire = undefined,
  headersMapping = {},
}: Props) => {
  const { version } = usePageApiVersion();
  const resolvedVersion =
    forceVersion ||
    (version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version);
  return renderAPI(packageName, resolvedVersion, apiName, strictTypes, testRequire, headersMapping);
};

export default APISection;
