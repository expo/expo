import { css } from '@emotion/react';
import React from 'react';

import { androidPermissions, AndroidPermissionItem } from './data';

import { InlineCode } from '~/components/base/code';
import { Quote } from '~/components/base/paragraph';
import { Info } from '~/components/icons/Info';

type AndroidPermissionsProps = {
  keys: string[];
};

export function AndroidPermissions(props: AndroidPermissionsProps) {
  const list = props.keys.map(key => androidPermissions[key]);

  return (
    <table>
      <thead>
        <tr>
          <th>Android Permission</th>
          <th>
            <span
              css={grantedByInfoStyle}
              title="Some permissions are granted by the system without user approval">
              Granted by <Info size={11} />
            </span>
          </th>
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

function AndroidPermissionRow(permission: AndroidPermissionItem) {
  const { name, description, descriptionLong, warning, apiDeprecated } = permission;

  return (
    <tr css={apiDeprecated && deprecatedStyle}>
      <td>
        <InlineCode>{name}</InlineCode>
      </td>
      <td>
        <i>{getPermissionGranter(permission)}</i>
      </td>
      <td>
        {!!description && (
          <p css={(warning || descriptionLong) && descriptionSpaceStyle}>{description}</p>
        )}
        {!!warning && (
          <Quote css={quoteStyle}>
            <span>⚠️ {warning}</span>
          </Quote>
        )}
        {descriptionLong && !warning && (
          <Quote css={quoteStyle}>
            <span dangerouslySetInnerHTML={{ __html: descriptionLong }} />
          </Quote>
        )}
      </td>
    </tr>
  );
}

const grantedByInfoStyle = css`
  white-space: nowrap;
  
  svg {
    vertical-align: middle;
  }
`;

const deprecatedStyle = css`
  opacity: 0.5;
`;

const descriptionSpaceStyle = css`
  margin-bottom: 1rem;
`;

const quoteStyle = css`
  margin-bottom: 0;
`;

function getPermissionGranter(permission: AndroidPermissionItem): 'user' | 'system' | 'none' {
  if (!permission.protection) return 'none';
  if (permission.protection.includes('dangerous')) return 'user';
  return 'system';
}
