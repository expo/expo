import { mergeClasses } from '@expo/styleguide';

import { MethodParamData } from '~/components/plugins/api/APIDataTypes';
import { VERTICAL_SPACING } from '~/components/plugins/api/styles';
import { Table } from '~/ui/components/Table';

import { APIParamRow } from './APIParamRow';
import { APIParamsTableHeadRow } from './APIParamsTableHeadRow';

type Props = {
  parameters: MethodParamData[];
  sdkVersion: string;
};

export function APIMethodParamRows({ parameters, sdkVersion }: Props) {
  const hasDescription = Boolean(parameters.some(param => param.comment));
  return (
    <Table containerClassName={mergeClasses(VERTICAL_SPACING, 'mt-0.5')}>
      <APIParamsTableHeadRow hasDescription={hasDescription} mainCellLabel="Parameter" />
      <tbody>
        {parameters?.map(param => (
          <APIParamRow
            key={param.name}
            param={param}
            sdkVersion={sdkVersion}
            showDescription={hasDescription}
          />
        ))}
      </tbody>
    </Table>
  );
}
