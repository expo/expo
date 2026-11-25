import { Changelog } from '../Changelogs';
import { GitDirectory } from '../Git';
import { PackageViewType } from '../Npm';
import { Package } from '../Packages';

/**
 * Command's options.
 */
export type CommandOptions = {
  packageNames: string[];
  exclude: string[];
  tag: string;
  select: boolean;
  drop: boolean;
  demote: boolean;
  dry: boolean;
  list: boolean;
  reverse?: boolean;
  promptOtp?: boolean;
};

/**
 * Type of parcel's state.
 */
export type PromoteState = {
  distTags?: string[];
  versionToReplace?: string | null;
  isDemoting?: boolean;
};

export type Parcel = {
  pkg: Package;
  pkgView: PackageViewType | null;
  changelog: Changelog;
  gitDir: GitDirectory;
  state: PromoteState;
};

export type TaskArgs = [Parcel[], CommandOptions];
