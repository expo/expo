import { BaseParcel } from '../publish-packages/types';

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
};

/**
 * Type of parcel's state.
 */
export type PromoteState = {
  distTags?: string[];
  versionToReplace?: string | null;
  isDemoting?: boolean;
};

export type Parcel = BaseParcel<PromoteState>;

export type TaskArgs = [Parcel[], CommandOptions];
