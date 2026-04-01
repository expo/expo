/**
 * Package-scope pipeline steps.
 *
 * These run once per package (before iterating over flavors/products).
 */
import { Dependencies } from '../Dependencies';
import type { PrebuildContext } from './Context';
import type { Step } from './Types';

// ---------------------------------------------------------------------------
// Package-scope steps
// ---------------------------------------------------------------------------

export const cleanPackageStep: Step<PrebuildContext> = {
  id: 'clean:package',
  scope: 'package',
  label: 'Clean package outputs',
  onError: 'skip-remaining',

  shouldRun: (ctx) => ctx.request.clean,

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    for (const flavor of ctx.request.buildFlavors) {
      await Dependencies.cleanXCFrameworksFolderAsync(pkg, flavor);
    }
    await Dependencies.cleanGeneratedFolderAsync(pkg);
  },
};

/**
 * All package-scope steps in execution order.
 */
export const packageSteps: Step<PrebuildContext>[] = [cleanPackageStep];
