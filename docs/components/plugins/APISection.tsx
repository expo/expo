import React, { useContext } from 'react';

import { P } from '~/components/base/paragraph';
import { ClassDefinitionData, GeneratedData } from '~/components/plugins/api/APIDataTypes';
import APISectionClasses from '~/components/plugins/api/APISectionClasses';
import APISectionComponents from '~/components/plugins/api/APISectionComponents';
import APISectionConstants from '~/components/plugins/api/APISectionConstants';
import APISectionEnums from '~/components/plugins/api/APISectionEnums';
import APISectionInterfaces from '~/components/plugins/api/APISectionInterfaces';
import APISectionMethods from '~/components/plugins/api/APISectionMethods';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import APISectionTypes from '~/components/plugins/api/APISectionTypes';
import { TypeDocKind } from '~/components/plugins/api/APISectionUtils';
import { usePageApiVersion } from '~/providers/page-api-version';

const LATEST_VERSION = `v${require('~/package.json').version}`;

type Props = {
  packageName: string;
  apiName?: string;
  forceVersion?: string;
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

const isComponent = ({ type, extendedTypes, signatures }: GeneratedData) =>
  (type?.name && ['React.FC', 'ForwardRefExoticComponent'].includes(type?.name)) ||
  (extendedTypes && extendedTypes.length ? extendedTypes[0].name === 'Component' : false) ||
  (signatures && signatures[0]
    ? signatures[0].type.name === 'Element' ||
      (signatures[0].parameters && signatures[0].parameters[0].name === 'props')
    : false);

const isConstant = ({ name, type }: GeneratedData) =>
  !['default', 'Constants', 'EventEmitter'].includes(name) &&
  !(type?.name && ['React.FC', 'ForwardRefExoticComponent'].includes(type?.name));

const renderAPI = (
  packageName: string,
  version: string = 'unversioned',
  apiName?: string,
  isTestMode: boolean = false
): JSX.Element => {
  try {
    // note(simek): When the path prefix is interpolated Next or Webpack fails to locate the file
    const { children: data } = isTestMode
      ? require(`../../public/static/data/${version}/${packageName}.json`)
      : require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = filterDataByKind(
      data,
      TypeDocKind.Function,
      entry => !isListener(entry) && !isHook(entry) && !isComponent(entry)
    );
    const hooks = filterDataByKind(data, TypeDocKind.Function, isHook);
    const eventSubscriptions = filterDataByKind(data, TypeDocKind.Function, isListener);

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
        )
    );

    const props = filterDataByKind(
      data,
      TypeDocKind.TypeAlias,
      entry => isProp(entry) && !!(entry.type.types || entry.type.declaration?.children)
    );
    const defaultProps = filterDataByKind(
      data
        .filter((entry: GeneratedData) => entry.kind === TypeDocKind.Class)
        .map((entry: GeneratedData) => entry.children)
        .flat(),
      TypeDocKind.Property,
      entry => entry.name === 'defaultProps'
    )[0];

    const enums = filterDataByKind(data, [TypeDocKind.Enum, TypeDocKind.LegacyEnum]);
    const interfaces = filterDataByKind(data, TypeDocKind.Interface);
    const constants = filterDataByKind(data, TypeDocKind.Variable, entry => isConstant(entry));

    const components = filterDataByKind(
      data,
      [TypeDocKind.Variable, TypeDocKind.Class, TypeDocKind.Function],
      entry => isComponent(entry)
    );
    const componentsPropNames = components.map(component => `${component.name}Props`);
    const componentsProps = filterDataByKind(props, TypeDocKind.TypeAlias, entry =>
      componentsPropNames.includes(entry.name)
    );

    const classes = filterDataByKind(
      data,
      TypeDocKind.Class,
      entry => !isComponent(entry) && (apiName ? !entry.name.includes(apiName) : true)
    );

    const componentsChildren = components
      .map((cls: ClassDefinitionData) =>
        cls.children?.filter(
          child =>
            child.kind === TypeDocKind.Method &&
            child?.flags?.isExternal !== true &&
            child.name !== 'render' &&
            // note(simek): hide unannotated "private" methods
            !child.name.startsWith('_')
        )
      )
      .flat();

    const methodsNames = methods.map(method => method.name);
    const staticMethods = componentsChildren.filter(
      // note(simek): hide duplicate exports for Camera API
      method => method?.flags?.isStatic === true && !methodsNames.includes(method.name)
    );
    const componentMethods = componentsChildren
      .filter(method => method?.flags?.isStatic !== true && !method?.overwrites)
      .filter(Boolean);

    return (
      <>
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
        <APISectionTypes data={types} />
        <APISectionInterfaces data={interfaces} />
        <APISectionEnums data={enums} />
      </>
    );
  } catch (error) {
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection = ({ packageName, apiName, forceVersion }: Props) => {
  const { version } = usePageApiVersion();
  const resolvedVersion =
    forceVersion ||
    (version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version);
  return renderAPI(packageName, resolvedVersion, apiName, !!forceVersion);
};

export default APISection;
