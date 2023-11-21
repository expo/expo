import semver from 'semver';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks.types';

export interface DoctorMultiCheckItemBase {
  getMessage: ((packageName: string) => string) | (() => string);
  sdkVersionRange: string;
}

//
export abstract class DoctorMultiCheck<TCheckItem extends DoctorMultiCheckItemBase>
  implements DoctorCheck {
  abstract readonly checkItems: TCheckItem[];

  abstract description: string;

  // will be the most permissive semver for all check items
  abstract sdkVersionRange: string;

  protected abstract runAsyncInner(
    params: DoctorCheckParams,
    checkItems: TCheckItem[]
  ): Promise<DoctorCheckResult>;

  async runAsync(params: DoctorCheckParams): Promise<DoctorCheckResult> {
    const filteredCheckItems = this.checkItems.filter(
      check =>
        params.exp.sdkVersion === 'UNVERSIONED' ||
        semver.satisfies(params.exp.sdkVersion!, check.sdkVersionRange)
    );

    return this.runAsyncInner(params, filteredCheckItems);
  }
}
