import React, { useContext } from 'react';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { P } from '~/components/base/paragraph';
import { DefaultPropsDefinitionData, GeneratedData } from '~/components/plugins/api/APIDataTypes';
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
};

const filterDataByKind = (
  entries: GeneratedData[],
  kind: TypeDocKind,
  additionalCondition: (entry: GeneratedData) => boolean = () => true
) =>
  entries
    ? entries.filter((entry: GeneratedData) => entry.kind === kind && additionalCondition(entry))
    : [];

const renderAPI = (
  packageName: string,
  version: string = 'unversioned',
  apiName?: string
): JSX.Element => {
  try {
    const data = require(`~/public/static/data/${version}/${packageName}.json`).children;

    const methods = filterDataByKind(data, TypeDocKind.Function);
    const types = filterDataByKind(
      data,
      TypeDocKind.TypeAlias,
      entry => !!(entry.type.declaration || entry.type.types)
    );
    const props = filterDataByKind(data, TypeDocKind.TypeAlias, entry =>
      entry.name.includes('Props')
    );
    const defaultProps = filterDataByKind(
      data.filter(
        (defaultProp: DefaultPropsDefinitionData) => defaultProp.kind === TypeDocKind.Class
      )[0]?.children,
      TypeDocKind.Property,
      entry => entry.name === 'defaultProps'
    )[0];
    const enums = filterDataByKind(data, TypeDocKind.Enum);
    const interfaces = filterDataByKind(data, TypeDocKind.Interface);
    const constants = filterDataByKind(data, TypeDocKind.Variable, entry => entry.flags.isConst);

    return (
      <div>
        <APISectionConstants data={constants} apiName={apiName} />
        <APISectionMethods data={methods} apiName={apiName} />
        <APISectionProps data={props} defaultProps={defaultProps} />
        <APISectionTypes data={types} />
        <APISectionInterfaces data={interfaces} />
        <APISectionEnums data={enums} />
      </div>
    );
  } catch (error) {
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection: React.FC<Props> = ({ packageName, apiName }) => {
  const { version } = useContext(DocumentationPageContext);
  const resolvedVersion =
    version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version;
  return renderAPI(packageName, resolvedVersion, apiName);
};

export default APISection;
