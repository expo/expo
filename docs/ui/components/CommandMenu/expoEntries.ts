import { SnackLogo } from '@expo/styleguide';
import {
  BuildIcon,
  DeploymentIcon,
  Grid01Icon,
  Settings01Icon,
  EasSubmitIcon,
  ChannelIcon,
  GitBranch01Icon,
  UpdateIcon,
  CredentialIcon,
  Key01Icon,
} from '@expo/styleguide-icons';

export const entries = [
  {
    label: 'Account Settings',
    url: 'https://expo.dev/accounts/[account]/settings',
    Icon: Settings01Icon,
  },
  {
    label: 'User Settings',
    url: 'https://expo.dev/settings',
    Icon: Settings01Icon,
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
    Icon: GitBranch01Icon,
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
    Icon: Key01Icon,
  },
  {
    label: 'Project Settings',
    url: 'https://expo.dev/accounts/[account]/projects/[project]/settings',
    Icon: Settings01Icon,
  },
];
