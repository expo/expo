import { SnackLogo } from '@expo/styleguide';
import {
  BuildIcon,
  Grid01Icon,
  Settings01Icon,
  EasSubmitIcon,
  CredentialIcon,
  Key01Icon,
  LayersThree01Icon,
  BranchIcon,
  Cube02Icon,
  Dataflow03Icon,
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
    Icon: Dataflow03Icon,
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
    Icon: LayersThree01Icon,
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
