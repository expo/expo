import React, { useContext } from 'react';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { P } from '~/components/base/paragraph';
import APISectionEnums from '~/components/plugins/api/APISectionEnums';
import APISectionMethods from '~/components/plugins/api/APISectionMethods';
import APISectionProps from '~/components/plugins/api/APISectionProps';
import APISectionTypes from '~/components/plugins/api/APISectionTypes';
import { TypeDocKind } from '~/components/plugins/api/APISectionUtils';

const LATEST_VERSION = `v${require('~/package.json').version}`;

type Props = {
  packageName: string;
  apiName?: string;
};

const filterData = (
  entries: any[],
  kind: TypeDocKind,
  additionalCondition: (entry: any) => boolean = () => true
) =>
  entries ? entries.filter((entry: any) => entry.kind === kind && additionalCondition(entry)) : [];

const renderAPI = (
  packageName: string,
  version: string = 'unversioned',
  apiName?: string
): JSX.Element => {
  try {
    const data = require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = filterData(data.children, TypeDocKind.Function);
    const types = filterData(
      data.children,
      TypeDocKind.TypeAlias,
      entry => entry.type.declaration || entry.type.types
    );
    const props = filterData(data.children, TypeDocKind.TypeAlias, entry =>
      entry.name.includes('Props')
    );
    const defaultProps = filterData(
      filterData(data.children, TypeDocKind.Class)[0]?.children,
      TypeDocKind.Property,
      entry => entry.name === 'defaultProps'
    )[0];
    const enums = filterData(data.children, TypeDocKind.Enum);

    return (
      <div>
        <APISectionMethods data={methods} apiName={apiName} />
        <APISectionProps data={props} defaultProps={defaultProps} />
        <APISectionTypes data={types} />
        <APISectionEnums data={enums} />
      </div>
    );
  } catch (e) {
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
