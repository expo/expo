import {
  BuildIcon,
  DeploymentIcon,
  OverviewIcon,
  SettingsIcon,
  EasSubmitIcon,
  ChannelIcon,
  BranchIcon,
  UpdateIcon,
  CredentialIcon,
  SecretsIcon,
  SnackLogo,
} from '@expo/styleguide';

export const entries = [
  {
    label: 'Account Settings',
    url: 'https://expo.dev/accounts/[account]/settings',
    Icon: SettingsIcon,
  },
  {
    label: 'User Settings',
    url: 'https://expo.dev/settings',
    Icon: SettingsIcon,
  },
  {
    label: 'Snacks',
    url: 'https://expo.dev/accounts/[account]/snacks',
    Icon: SnackLogo,
  },
  {
    label: 'Project Overview',
    url: 'https://expo.dev/accounts/[account]/projects/[project]',
    Icon: OverviewIcon,
  },
  {
    label: 'Project Deployments',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/deployments',
    Icon: DeploymentIcon,
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
    Icon: ChannelIcon,
  },
  {
    label: 'Project Branches',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/branches',
    Icon: BranchIcon,
  },
  {
    label: 'Project Updates',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/updates',
    Icon: UpdateIcon,
  },
  {
    label: 'Project Credentials',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/credentials',
    Icon: CredentialIcon,
  },
  {
    label: 'Project Secrets',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/secrets',
    Icon: SecretsIcon,
  },
  {
    label: 'Project Settings',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/settings',
    Icon: SettingsIcon,
  },
];
