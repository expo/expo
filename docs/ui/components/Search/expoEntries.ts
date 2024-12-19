import { SnackLogo } from '@expo/styleguide';
import { BranchIcon } from '@expo/styleguide-icons/custom/BranchIcon';
import { BuildIcon } from '@expo/styleguide-icons/custom/BuildIcon';
import { CredentialIcon } from '@expo/styleguide-icons/custom/CredentialIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { Smartphone01Icon } from '@expo/styleguide-icons/custom/Smartphone01Icon';
import { BracketsXIcon } from '@expo/styleguide-icons/outline/BracketsXIcon';
import { Cube02Icon } from '@expo/styleguide-icons/outline/Cube02Icon';
import { DataIcon } from '@expo/styleguide-icons/outline/DataIcon';
import { Dataflow01Icon } from '@expo/styleguide-icons/outline/Dataflow01Icon';
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
    label: 'Account Settings',
    url: 'https://expo.dev/accounts/[account]/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'Account Audit Logs',
    url: 'https://expo.dev/accounts/[account]/settings/audit-logs',
    Icon: FileSearch02Icon,
  },
  {
    label: 'User Settings',
    url: 'https://expo.dev/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'User Security Activity',
    url: 'https://expo.dev/settings/security-activity',
    Icon: FileSearch02Icon,
  },
  {
    label: 'Snacks',
    url: 'https://expo.dev/accounts/[account]/snacks',
    Icon: SnackLogo,
  },
  {
    label: 'Project Overview',
    url: 'https://expo.dev/accounts/[account]/projects/[project]',
    Icon: Grid01Icon,
  },
  {
    label: 'Project Insights',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/insights',
    Icon: DataIcon,
  },
  {
    label: 'Project Deployments',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/deployments',
    Icon: Dataflow03Icon,
  },
  {
    label: 'Project Development Builds',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/development-builds',
    Icon: Smartphone01Icon,
  },
  {
    label: 'Project Builds',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/builds',
    Icon: BuildIcon,
  },
  {
    label: 'Project Submissions',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/submissions',
    Icon: EasSubmitIcon,
  },
  {
    label: 'Project Channels',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/channels',
    Icon: Cube02Icon,
  },
  {
    label: 'Project Branches',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/branches',
    Icon: BranchIcon,
  },
  {
    label: 'Project Updates',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/updates',
    Icon: LayersTwo02Icon,
  },
  {
    label: 'Project Credentials',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/credentials',
    Icon: CredentialIcon,
  },
  {
    label: 'Project Workflows',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/workflows',
    Icon: Dataflow01Icon,
  },
  {
    label: 'Project Push Notifications',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/push-notifications',
    Icon: NotificationBoxIcon,
  },
  {
    label: 'Project Environment Variables',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/environment-variables',
    Icon: BracketsXIcon,
  },
  {
    label: 'Project Settings',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/settings',
    Icon: Settings01Icon,
  },
];
