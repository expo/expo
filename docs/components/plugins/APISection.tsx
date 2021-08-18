import React, { useContext } from 'react';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { P } from '~/components/base/paragraph';
import { GeneratedData } from '~/components/plugins/api/APIDataTypes';
import APISectionComponents from '~/components/plugins/api/APISectionComponents';
import APISectionConstants from '~/components/plugins/api/APISectionConstants';
import APISectionEnums from '~/components/plugins/api/APISectionEnums';
import APISectionInterfaces from '~/components/plugins/api/APISectionInterfaces';
import APISectionMethods from '~/components/plugins/api/APISectionMethods';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import APISectionTypes from '~/components/plugins/api/APISectionTypes';
import { TypeDocKind } from '~/components/plugins/api/APISectionUtils';

const LATEST_VERSION = `v${require('~/package.json').version}`;

type Props = {
  packageName: string;
  apiName?: string;
  forceVersion?: string;
};

const filterDataByKind = (
  entries: GeneratedData[],
  kind: TypeDocKind,
  additionalCondition: (entry: GeneratedData) => boolean = () => true
) =>
  entries
    ? entries.filter((entry: GeneratedData) => entry.kind === kind && additionalCondition(entry))
    : [];

const isHook = ({ name }: GeneratedData) =>
  name.startsWith('use') &&
  // note(simek): hardcode this exception until the method will be renamed
  name !== 'useSystemBrightnessAsync';

const isListener = ({ name }: GeneratedData) =>
  name.endsWith('Listener') || name.endsWith('Listeners');

const isProp = ({ name }: GeneratedData) => name.includes('Props') && name !== 'ErrorRecoveryProps';

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
      entry => !isListener(entry) && !isHook(entry)
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

    const enums = filterDataByKind(data, TypeDocKind.Enum);
    const interfaces = filterDataByKind(data, TypeDocKind.Interface);
    const constants = filterDataByKind(
      data,
      TypeDocKind.Variable,
      entry =>
        (entry?.flags?.isConst || false) &&
        entry.name !== 'default' &&
        entry?.type?.name !== 'React.FC'
    );

    const components = filterDataByKind(
      data,
      TypeDocKind.Variable,
      entry => entry?.type?.name === 'React.FC'
    );
    const componentsPropNames = components.map(component => `${component.name}Props`);
    const componentsProps = filterDataByKind(props, TypeDocKind.TypeAlias, entry =>
      componentsPropNames.includes(entry.name)
    );

    return (
      <>
        <APISectionComponents data={components} componentsProps={componentsProps} />
        <APISectionConstants data={constants} apiName={apiName} />
        <APISectionMethods data={hooks} header="Hooks" />
        <APISectionMethods data={methods} apiName={apiName} />
        <APISectionMethods
          data={eventSubscriptions}
          apiName={apiName}
          header="Event Subscriptions"
        />
        {props && !componentsProps.length ? (
          <APISectionProps data={props} defaultProps={defaultProps} />
        ) : null}
        <APISectionTypes data={types} />
        <APISectionInterfaces data={interfaces} />
        <APISectionEnums data={enums} />
      </>
    );
  } catch (error) {
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection: React.FC<Props> = ({ packageName, apiName, forceVersion }) => {
  const { version } = useContext(DocumentationPageContext);
  const resolvedVersion =
    forceVersion ||
    (version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version);
  return renderAPI(packageName, resolvedVersion, apiName, !!forceVersion);
};

export default APISection;
