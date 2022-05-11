import { css } from '@emotion/react';
import React from 'react';

import { androidPermissions, AndroidPermission, PermissionReference } from './data';

import Permalink from '~/components/Permalink';
import { InlineCode } from '~/components/base/code';
import { Quote } from '~/components/base/paragraph';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';

// TODO(cedric): all commented code is related to the "granter" column.
// This column defines if the permission is granted by the system or user (requires notification).
// We have to clearly communicate what it means before showing it to the user.

// import { QuestionIcon } from '~/components/icons/QuestionIcon';

type AndroidPermissionsProps = {
  permissions: PermissionReference<AndroidPermission>[];
};

// const grantedByInfo = 'Some permissions are granted by the system without user approval';

export function AndroidPermissions({ permissions }: AndroidPermissionsProps) {
  const list = React.useMemo(() => getPermissions(permissions), [permissions]);

  return (
    <Table>
      <TableHead>
        <Row>
          <HeaderCell>Android Permission</HeaderCell>
          {/* <HeaderCell>
            <span css={grantedByInfoStyle} title={grantedByInfo}>
              Granted by <QuestionIcon size={12} title={grantedByInfo} />
            </span>
          </HeaderCell> */}
          <HeaderCell>Description</HeaderCell>
        </Row>
      </TableHead>
      <tbody>
        {list.map(permission => (
          <AndroidPermissionRow key={permission.name} {...permission} />
        ))}
      </tbody>
    </Table>
  );
}

function AndroidPermissionRow({
  name,
  description,
  explanation,
  warning,
  apiDeprecated,
}: AndroidPermission) {
  return (
    <Row subtle={!!apiDeprecated}>
      <Cell>
        <Permalink id={`permission-${name.toLowerCase()}`}>
          <span>
            <InlineCode>{name}</InlineCode>
          </span>
        </Permalink>
      </Cell>
      {/* <Cell>
        <i>{getPermissionGranter(permission)}</i>
      </Cell> */}
      <Cell>
        {!!description && (
          <p css={(warning || explanation) && descriptionSpaceStyle}>{description}</p>
        )}
        {!!warning && (
          <Quote css={quoteStyle}>
            <span>⚠️ {warning}</span>
          </Quote>
        )}
        {explanation && !warning && (
          <Quote css={quoteStyle}>
            <span dangerouslySetInnerHTML={{ __html: explanation }} />
          </Quote>
        )}
      </Cell>
    </Row>
  );
}

function getPermissions(permissions: AndroidPermissionsProps['permissions']) {
  return permissions
    .map(permission =>
      typeof permission === 'string'
        ? androidPermissions[permission]
        : { ...androidPermissions[permission.name], ...permission }
    )
    .filter(Boolean);
}

// const grantedByInfoStyle = css`
//   white-space: nowrap;
// `;

const descriptionSpaceStyle = css`
  margin-bottom: 1rem;
`;

const quoteStyle = css`
  margin-bottom: 0;
`;

// function getPermissionGranter(permission: AndroidPermission): 'user' | 'system' | 'none' {
//   if (!permission.protection) return 'none';
//   if (permission.protection.includes('dangerous')) return 'user';
//   return 'system';
// }
