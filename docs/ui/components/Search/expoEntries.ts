import { SnackLogo } from '@expo/styleguide';
import { BranchIcon } from '@expo/styleguide-icons/custom/BranchIcon';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { CredentialIcon } from '@expo/styleguide-icons/custom/CredentialIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { Smartphone01Icon } from '@expo/styleguide-icons/custom/Smartphone01Icon';
import { Cloud01DuotoneIcon } from '@expo/styleguide-icons/duotone/Cloud01DuotoneIcon';
import { Fingerprint03DuotoneIcon } from '@expo/styleguide-icons/duotone/Fingerprint03DuotoneIcon';
import { BracketsXIcon } from '@expo/styleguide-icons/outline/BracketsXIcon';
import { Cube02Icon } from '@expo/styleguide-icons/outline/Cube02Icon';
import { DataIcon } from '@expo/styleguide-icons/outline/DataIcon';
import { Dataflow03Icon } from '@expo/styleguide-icons/outline/Dataflow03Icon';
import { FileSearch02Icon } from '@expo/styleguide-icons/outline/FileSearch02Icon';
import { Grid01Icon } from '@expo/styleguide-icons/outline/Grid01Icon';
import { LayersTwo02Icon } from '@expo/styleguide-icons/outline/LayersTwo02Icon';
import { NotificationBoxIcon } from '@expo/styleguide-icons/outline/NotificationBoxIcon';
import { Settings01Icon } from '@expo/styleguide-icons/outline/Settings01Icon';
import type { ComponentType, HTMLAttributes } from 'react';

export type ExpoItemType = {
  label: string;
  url: string;
  Icon?: ComponentType<HTMLAttributes<SVGSVGElement>>;
};

export const entries: ExpoItemType[] = [
  {
    label: 'Account settings',
    url: 'https://expo.dev/accounts/[account]/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'Account audit logs',
    url: 'https://expo.dev/accounts/[account]/settings/audit-logs',
    Icon: FileSearch02Icon,
  },
  {
    label: 'User settings',
    url: 'https://expo.dev/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'User security activity',
    url: 'https://expo.dev/settings/security-activity',
    Icon: FileSearch02Icon,
  },
  {
    label: 'Snacks',
    url: 'https://expo.dev/accounts/[account]/snacks',
    Icon: SnackLogo,
  },
  {
    label: 'Project overview',
    url: 'https://expo.dev/accounts/[account]/projects/[project]',
    Icon: Grid01Icon,
  },
  {
    label: 'Project insights',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/insights',
    Icon: DataIcon,
  },
  {
    label: 'Project workflows',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/workflows',
    Icon: Dataflow03Icon,
  },
  {
    label: 'Project development builds',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/development-builds',
    Icon: Smartphone01Icon,
  },
  {
    label: 'Project builds',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/builds',
    Icon: BuildIcon,
  },
  {
    label: 'Project submissions',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/submissions',
    Icon: EasSubmitIcon,
  },
  {
    label: 'Project update channels',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/channels',
    Icon: Cube02Icon,
  },
  {
    label: 'Project update branches',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/branches',
    Icon: BranchIcon,
  },
  {
    label: 'Project update groups',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/updates',
    Icon: LayersTwo02Icon,
  },
  {
    label: 'Project hosting',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/hosting',
    Icon: Cloud01DuotoneIcon,
  },
  {
    label: 'Project push notifications',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/push-notifications',
    Icon: NotificationBoxIcon,
  },
  {
    label: 'Project fingerprints',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/distribution',
    Icon: Fingerprint03DuotoneIcon,
  },
  {
    label: 'Project settings',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'Project credentials',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/credentials',
    Icon: CredentialIcon,
  },
  {
    label: 'Project environment variables',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/environment-variables',
    Icon: BracketsXIcon,
  },
];
