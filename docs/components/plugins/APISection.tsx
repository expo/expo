import React, { useContext } from 'react';

import DocumentationPageContext from '~/components/DocumentationPageContext';
import { P } from '~/components/base/paragraph';
import APISectionEnums from '~/components/plugins/api/APISectionEnums';
import APISectionMethods from '~/components/plugins/api/APISectionMethods';
import APISectionTypes from '~/components/plugins/api/APISectionTypes';
import { TypeDocKind } from '~/components/plugins/api/APISectionUtils';

const LATEST_VERSION = `v${require('~/package.json').version}`;

type Props = {
  packageName: string;
};

const renderAPI = (packageName: string, version: string = 'unversioned'): JSX.Element => {
  try {
    const data = require(`~/public/static/data/${version}/${packageName}.json`);

    const methods = data.children?.filter((g: any) => g.kind === TypeDocKind.Function);
    const types = data.children?.filter((g: any) => g.kind === TypeDocKind.TypeAlias);
    const enums = data.children?.filter((g: any) => g.kind === TypeDocKind.Enum);

    return (
      <div>
        <APISectionMethods data={methods} />
        <APISectionTypes data={types} />
        <APISectionEnums data={enums} />
      </div>
    );
  } catch (e) {
    return <P>No API data file found, sorry!</P>;
  }
};

const APISection: React.FC<Props> = ({ packageName }) => {
  const { version } = useContext(DocumentationPageContext);
  const resolvedVersion =
    version === 'unversioned' ? version : version === 'latest' ? LATEST_VERSION : version;
  return renderAPI(packageName, resolvedVersion);
};

export default APISection;
