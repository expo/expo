import { css } from '@emotion/react';
import React from 'react';

import { androidPermissions, AndroidPermission, PermissionReference } from './data';

import Permalink from '~/components/Permalink';
import { InlineCode } from '~/components/base/code';
import { Quote } from '~/components/base/paragraph';

// TODO(cedric): all commented code is related to the "granter" column.
// This column defines if the permission is granted by the system or user (requires notification).
// We have to clearly communicate what it means before showing it to the user.

// import { QuestionIcon } from '~/components/icons/QuestionIcon';

type AndroidPermissionsProps = {
  permissions: PermissionReference<AndroidPermission>[];
};

// const grantedByInfo = 'Some permissions are granted by the system without user approval';

export function AndroidPermissions(props: AndroidPermissionsProps) {
  const list = React.useMemo(() => getPermissions(props.permissions), [props.permissions]);

  return (
    <table>
      <thead>
        <tr>
          <th>Android Permission</th>
          {/* <th>
            <span css={grantedByInfoStyle} title={grantedByInfo}>
              Granted by <QuestionIcon size={12} title={grantedByInfo} />
            </span>
          </th> */}
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {list.map(permission => (
          <AndroidPermissionRow key={permission.name} {...permission} />
        ))}
      </tbody>
    </table>
  );
}

function AndroidPermissionRow(permission: AndroidPermission) {
  const { name, description, explanation, warning, apiDeprecated } = permission;

  return (
    <tr css={apiDeprecated && deprecatedStyle}>
      <td>
        <Permalink id={`permission-${name.toLowerCase()}`}>
          <span>
            <InlineCode>{name}</InlineCode>
          </span>
        </Permalink>
      </td>
      {/* <td>
        <i>{getPermissionGranter(permission)}</i>
      </td> */}
      <td>
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
      </td>
    </tr>
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

const deprecatedStyle = css`
  opacity: 0.5;
`;

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
