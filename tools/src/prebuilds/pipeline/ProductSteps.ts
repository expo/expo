/**
 * Product-scope pipeline steps: clean, generate, build, compose, verify.
 *
 * Each step wraps existing module calls without changing their internals.
 */

import chalk from 'chalk';
import path from 'path';

import logger from '../../Logger';
import { Codegen } from '../Codegen';
import { composeCustomBuildAsync, runCustomBuildAsync } from '../CustomBuild';
import { Frameworks } from '../Frameworks';
import {
  composeHeadersXCFrameworkAsync,
  shouldWriteHeadersXCFramework,
} from '../HeadersXCFramework';
import { SPMBuild } from '../SPMBuild';
import { SPMGenerator } from '../SPMGenerator';
import { findStubMismatchesAsync, isReleaseStub } from '../StubXCFramework';
import { FrameworkVerifier } from '../Verifier';
import type { PrebuildContext } from './Context';
import type { Step, ProductStage } from './Types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convenience to get a UnitStatus for the current iteration pointers. */
function getCurrentUnit(ctx: PrebuildContext) {
  const unitId = `${ctx.currentPackage!.packageName}/${ctx.currentProduct!.name}[${ctx.currentFlavor}]`;
  return ctx.statuses.find((s) => s.unitId === unitId);
}

function setStage(
  ctx: PrebuildContext,
  stage: ProductStage,
  status: 'success' | 'failed' | 'warning'
) {
  const unit = getCurrentUnit(ctx);
  if (unit) {
    unit.stages[stage] = status;
  }
}

function isCurrentUnitReleaseStub({ currentPackage, currentFlavor }: PrebuildContext): boolean {
  return !!currentPackage && !!currentFlavor && isReleaseStub(currentPackage, currentFlavor);
}

/**
 * When this run builds Debug, the stub must come from that build: a Debug XCFramework left on disk
 * by an earlier run may not match this run's sources.
 */
function assertDebugUnitComposed(ctx: PrebuildContext): void {
  if (!ctx.request.buildFlavors.includes('Debug')) {
    return;
  }
  const { packageName } = ctx.currentPackage!;
  const { name } = ctx.currentProduct!;
  const debugUnit = ctx.statuses.find((s) => s.unitId === `${packageName}/${name}[Debug]`);
  const failed = !!debugUnit && Object.values(debugUnit.stages).includes('failed');
  if (!failed && debugUnit?.stages.compose === 'success' && !debugUnit.skipReason) {
    return;
  }
  const outcome = failed
    ? 'failed in this run'
    : `was skipped in this run${debugUnit?.skipReason ? ` (${debugUnit.skipReason})` : ''}`;
  throw new Error(
    `Cannot compose the Release flavor of ${name}: its package is debug-only (debugOnly in ` +
      `expo-module.config.json), so the Release flavor is made from this run's Debug XCFramework, ` +
      `and the Debug flavor of ${name} ${outcome}. An older Debug XCFramework on disk is not ` +
      `used, because it may not match the current sources. Fix the Debug failure reported above, ` +
      `then run the prebuild again.`
  );
}

/** A stub has no code to check; it only has to pair with its Debug flavor. */
async function verifyReleaseStubAsync(ctx: PrebuildContext): Promise<void> {
  const { buildPath, outputVersionPrefix } = ctx.currentPackage!;
  const { name } = ctx.currentProduct!;
  const mismatches = await findStubMismatchesAsync(
    Frameworks.getFrameworkPath(buildPath, name, 'Debug', outputVersionPrefix),
    Frameworks.getFrameworkPath(buildPath, name, 'Release', outputVersionPrefix)
  );
  if (mismatches.length > 0) {
    setStage(ctx, 'verify', 'failed');
    throw new Error(
      `The Release stub of ${name} does not pair with its Debug flavor: React Native requires ` +
        `the same Headers/ and Modules/module.modulemap in both, and these differ or are ` +
        `missing: ${mismatches.join(', ')}. Build both flavors in one run to remake the stub.`
    );
  }
  setStage(ctx, 'verify', 'success');
}

// ---------------------------------------------------------------------------
// clean:product
// ---------------------------------------------------------------------------

export const cleanProductStep: Step<PrebuildContext> = {
  id: 'clean:product',
  scope: 'product',
  label: 'Clean product build artifacts',
  onError: 'skip-remaining',

  shouldRun: (ctx) => ctx.request.clean && !isCurrentUnitReleaseStub(ctx),

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    const product = ctx.currentProduct!;
    const flavor = ctx.currentFlavor!;

    await SPMGenerator.cleanGeneratedSourceCodeFolderAsync(pkg, product);
    await SPMBuild.cleanBuildFolderAsync(pkg, product, flavor);
  },
};

// ---------------------------------------------------------------------------
// generate
// ---------------------------------------------------------------------------

export const generateStep: Step<PrebuildContext> = {
  id: 'generate',
  scope: 'product',
  label: 'Generate sources',
  onError: 'skip-remaining',

  shouldRun: (ctx) => !ctx.request.skipGenerate && !isCurrentUnitReleaseStub(ctx),

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    const product = ctx.currentProduct!;
    const flavor = ctx.currentFlavor!;
    const artifacts = ctx.artifactsByFlavor.get(flavor) ?? undefined;

    // customBuild products own their generation; nothing to do here.
    if (product.customBuild) {
      setStage(ctx, 'generate', 'success');
      return;
    }

    // Ensure codegen is generated for packages that need it (e.g., Fabric components)
    if (Codegen.hasCodegen(pkg)) {
      const generated = await Codegen.ensureCodegenAsync(pkg, (msg) => logger.info(msg));
      if (generated) {
        logger.info(`🔧 Generated codegen for ${chalk.green(pkg.packageName)}`);
      } else if (Codegen.isCodegenGenerated(pkg)) {
        logger.info(`🔧 Codegen already exists for ${chalk.green(pkg.packageName)}`);
      }
    }

    // Generate source code structure for the package/product
    await SPMGenerator.generateIsolatedSourcesForTargetsAsync(pkg, product);

    // Generate Package.swift for the package/product
    await SPMGenerator.generateSwiftPackageAsync(pkg, product, flavor, artifacts);

    setStage(ctx, 'generate', 'success');
  },
};

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

export const buildStep: Step<PrebuildContext> = {
  id: 'build',
  scope: 'product',
  label: 'Build Swift package',
  onError: 'skip-remaining',

  shouldRun: (ctx) => !ctx.request.skipBuild && !isCurrentUnitReleaseStub(ctx),

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    const product = ctx.currentProduct!;
    const flavor = ctx.currentFlavor!;
    const artifacts = ctx.artifactsByFlavor.get(flavor) ?? undefined;

    if (product.customBuild) {
      if (!artifacts) {
        throw new Error(`customBuild ${product.name}: artifacts missing for ${flavor}`);
      }
      await runCustomBuildAsync(
        pkg,
        product,
        artifacts,
        ctx.request.platformFilter,
        ctx.customBuiltProducts,
        ctx.request.clean
      );
      setStage(ctx, 'build', 'success');
      return;
    }

    // Compute hermes include paths for xcodebuild flags.
    // Hermes includes can't go in Package.swift because destroot/include/
    // contains jsi/ headers that conflict with React's jsi/ headers.
    const hermesIncludeDirs = artifacts
      ? [path.join(artifacts.hermes, 'destroot', 'include')]
      : undefined;

    await SPMBuild.buildSwiftPackageAsync(
      pkg,
      product,
      flavor,
      ctx.request.platformFilter,
      hermesIncludeDirs
    );

    setStage(ctx, 'build', 'success');
  },
};

// ---------------------------------------------------------------------------
// compose
// ---------------------------------------------------------------------------

export const composeStep: Step<PrebuildContext> = {
  id: 'compose',
  scope: 'product',
  label: 'Compose XCFramework',
  onError: 'skip-remaining',

  shouldRun: (ctx) => !ctx.request.skipCompose,

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    const product = ctx.currentProduct!;
    const flavor = ctx.currentFlavor!;

    if (isReleaseStub(pkg, flavor)) {
      assertDebugUnitComposed(ctx);
      await Frameworks.composeReleaseStubXCFrameworkAsync(pkg, product, ctx.request.signing);
    } else if (product.customBuild) {
      await composeCustomBuildAsync(pkg, product, flavor);
    } else {
      await Frameworks.composeXCFrameworkAsync(
        pkg,
        product,
        flavor,
        ctx.request.platformFilter,
        ctx.request.signing,
        { bundleSharedDeps: ctx.request.bundleSharedDeps }
      );
    }

    if (shouldWriteHeadersXCFramework(product, flavor, ctx.request.buildFlavors)) {
      await composeHeadersXCFrameworkAsync(pkg, product, flavor);
    }

    setStage(ctx, 'compose', 'success');
  },
};

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

export const verifyStep: Step<PrebuildContext> = {
  id: 'verify',
  scope: 'product',
  label: 'Verify XCFramework',
  onError: 'continue',

  shouldRun: (ctx) => !ctx.request.skipVerify,

  async run(ctx) {
    const pkg = ctx.currentPackage!;
    const product = ctx.currentProduct!;
    const flavor = ctx.currentFlavor!;

    if (isReleaseStub(pkg, flavor)) {
      await verifyReleaseStubAsync(ctx);
      return;
    }

    const verifyResults = await FrameworkVerifier.verifyXCFrameworkAsync(pkg, product, flavor);

    // Check if verification actually passed
    const verificationFailed = [...verifyResults.values()].some((report) => !report.overallSuccess);

    // Check for clang warnings (clang failed but overall passed)
    const hasClangWarnings = [...verifyResults.values()].some(
      (report) => report.overallSuccess && report.slices.some((s) => !s.clangModuleImport.success)
    );

    if (verificationFailed) {
      setStage(ctx, 'verify', 'failed');
      throw new Error('Verification failed - see above for details');
    } else if (hasClangWarnings) {
      setStage(ctx, 'verify', 'warning');
    } else {
      setStage(ctx, 'verify', 'success');
    }
  },
};

/**
 * All product-scope steps in execution order.
 */
export const productSteps: Step<PrebuildContext>[] = [
  cleanProductStep,
  generateStep,
  buildStep,
  composeStep,
  verifyStep,
];
