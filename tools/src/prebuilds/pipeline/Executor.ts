/**
 * Pipeline executor — parallel dispatch with DAG-aware scheduling.
 *
 * Orchestration:
 *   run-scope steps → parallel package execution (respecting dependency graph)
 *     → for each package: package-scope steps → flavor loop → product-scope steps
 *   → report summary → return PrebuildRunResult
 */
import chalk from 'chalk';

import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Dependencies } from '../Dependencies';
import type { SPMPackageSource } from '../ExternalPackage';
import { BuildFlavor } from '../Prebuilder.types';
import { runWithLogPrefix } from '../Utils';
import { ArtifactLock } from './ArtifactLock';
import type { PrebuildContext } from './Context';
import { packageSteps } from './PackageSteps';
import { productSteps } from './ProductSteps';
import { logPackageBanner, printPrebuildSummary, writeErrorLog } from './Reporter';
import { runSteps, resolveFlavorTemplatedPath } from './RunSteps';
import type { PackageResult } from './Scheduler';
import { runPackagesInParallel } from './Scheduler';
import type { PrebuildRunResult, Step, UnitStatus, UnitError, ProductStage } from './Types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUnitId(packageName: string, productName: string, flavor: string): string {
  return `${packageName}/${productName}[${flavor}]`;
}

function createUnitStatus(packageName: string, productName: string, flavor: string): UnitStatus {
  return {
    packageName,
    productName,
    flavor,
    unitId: makeUnitId(packageName, productName, flavor),
    stages: {
      generate: 'skipped',
      build: 'skipped',
      compose: 'skipped',
      verify: 'skipped',
    },
    elapsedMs: 0,
  };
}

function recordError(
  ctx: PrebuildContext,
  stage: ProductStage | 'clean' | 'prepare',
  error: unknown
) {
  const err = error instanceof Error ? error : new Error(String(error));
  ctx.errors.push({
    packageName: ctx.currentPackage?.packageName ?? '<unknown>',
    productName: ctx.currentProduct?.name ?? '<unknown>',
    flavor: ctx.currentFlavor ?? '<unknown>',
    unitId: makeUnitId(
      ctx.currentPackage?.packageName ?? '<unknown>',
      ctx.currentProduct?.name ?? '<unknown>',
      ctx.currentFlavor ?? '<unknown>'
    ),
    stage,
    error: err,
  });
  return err;
}

// ---------------------------------------------------------------------------
// Step runner (exported for unit testing)
// ---------------------------------------------------------------------------

export async function executeStep(
  step: Step<PrebuildContext>,
  ctx: PrebuildContext
): Promise<'ok' | 'stop-run' | 'skip-remaining'> {
  if (ctx.cancelled) {
    return 'stop-run';
  }

  if (!step.shouldRun(ctx)) {
    return 'ok';
  }

  try {
    await step.run(ctx);
    return 'ok';
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Determine which stage to record for product-scope steps
    const stage = (['generate', 'build', 'compose', 'verify'] as ProductStage[]).includes(
      step.id as ProductStage
    )
      ? (step.id as ProductStage)
      : step.id.startsWith('clean')
        ? ('clean' as const)
        : ('prepare' as const);

    recordError(ctx, stage, err);

    // Log the failure
    const pkg = ctx.currentPackage?.packageName ?? '';
    const product = ctx.currentProduct?.name ?? '';
    const prefix = pkg && product ? `[${pkg}/${product}] ` : '';
    logger.log(`❌ ${prefix}${step.label ?? step.id} failed: ${err.message}`);

    // Mark the stage as failed on the current unit (if applicable)
    if ((['generate', 'build', 'compose', 'verify'] as string[]).includes(step.id)) {
      const unitId = makeUnitId(
        ctx.currentPackage?.packageName ?? '',
        ctx.currentProduct?.name ?? '',
        ctx.currentFlavor ?? ''
      );
      const unit = ctx.statuses.find((s) => s.unitId === unitId);
      if (unit) {
        unit.stages[step.id as ProductStage] = 'failed';
      }
    }

    return step.onError === 'continue' ? 'ok' : step.onError;
  }
}

// ---------------------------------------------------------------------------
// Pipeline step configuration (injectable for testing)
// ---------------------------------------------------------------------------

export interface PipelineSteps {
  run: Step<PrebuildContext>[];
  package: Step<PrebuildContext>[];
  product: Step<PrebuildContext>[];
}

const defaultSteps: PipelineSteps = {
  run: runSteps,
  package: packageSteps,
  product: productSteps,
};

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

/**
 * PackageResult for a package being skipped because an upstream DAG dep failed.
 * One UnitStatus (all stages `'skipped'`, `skipReason` set) + one UnitError
 * per product×flavor — never touches disk.
 */
export function synthesizeSkippedResult(
  pkg: SPMPackageSource,
  failedDeps: string[],
  buildFlavors: BuildFlavor[],
  productFilter?: string
): PackageResult {
  const reason = `dependency ${failedDeps.join(', ')} failed`;
  const statuses: UnitStatus[] = [];
  const errors: UnitError[] = [];

  for (const product of pkg.getSwiftPMConfiguration().products) {
    if (productFilter && productFilter !== product.name) continue;
    for (const flavor of buildFlavors) {
      const status = createUnitStatus(pkg.packageName, product.name, flavor);
      status.skipReason = reason;
      statuses.push(status);
      errors.push({
        packageName: pkg.packageName,
        productName: product.name,
        flavor,
        unitId: status.unitId,
        stage: 'prepare',
        error: new Error(`Skipped: ${reason} — no build attempted`),
      });
    }
  }

  return { packageName: pkg.packageName, statuses, errors, stopRun: false };
}

/**
 * Executes all build steps for a single package (package-scope + flavor/product loops).
 * Uses its own per-package context clone so parallel packages don't share mutable state.
 */
function executePackageSteps(
  pkg: SPMPackageSource,
  index: number,
  totalPackages: number,
  rootCtx: PrebuildContext,
  steps: PipelineSteps,
  artifactLock: ArtifactLock,
  signal: AbortSignal
): Promise<PackageResult> {
  // Run the entire package build inside an AsyncLocalStorage context so that
  // all spinners (even those without an explicit `pkg` argument) are prefixed
  // with the package name — critical for readable parallel build output.
  return runWithLogPrefix(pkg.packageName, () =>
    executePackageStepsInner(pkg, index, totalPackages, rootCtx, steps, artifactLock, signal)
  );
}

async function executePackageStepsInner(
  pkg: SPMPackageSource,
  index: number,
  totalPackages: number,
  rootCtx: PrebuildContext,
  steps: PipelineSteps,
  artifactLock: ArtifactLock,
  signal: AbortSignal
): Promise<PackageResult> {
  // Create a per-package context that shares immutable/shared state by reference
  // but has its own iteration pointers, statuses, and errors.
  const ctx: PrebuildContext = {
    request: rootCtx.request,
    packages: rootCtx.packages,
    reactNativeVersion: rootCtx.reactNativeVersion,
    hermesVersion: rootCtx.hermesVersion,
    artifactsPath: rootCtx.artifactsPath,
    dependsOn: rootCtx.dependsOn,
    artifactsByFlavor: rootCtx.artifactsByFlavor,
    customBuiltProducts: rootCtx.customBuiltProducts,
    currentPackage: null,
    currentProduct: null,
    currentFlavor: null,
    statuses: [],
    errors: [],
    get cancelled() {
      return signal.aborted;
    },
    set cancelled(_: boolean) {
      // no-op — cancellation is driven by the AbortController
    },
    abortController: rootCtx.abortController,
  };

  const { request } = ctx;

  ctx.currentPackage = pkg;
  const spmConfig = pkg.getSwiftPMConfiguration();
  logPackageBanner(pkg, index, totalPackages, request.buildFlavors, ctx.artifactsPath);

  // --- Package-scope steps ---
  let stopRun = false;
  let skipPackage = false;
  for (const step of steps.package) {
    const outcome = await executeStep(step, ctx);
    if (outcome === 'stop-run') {
      stopRun = true;
      break;
    }
    if (outcome === 'skip-remaining') {
      skipPackage = true;
      break;
    }
  }

  if (!stopRun && !skipPackage) {
    // --- Flavor loop ---
    for (const flavor of request.buildFlavors) {
      if (ctx.cancelled) break;

      ctx.currentFlavor = flavor;

      // Download artifacts (once per flavor, shared across all packages via lock)
      if (!ctx.artifactsByFlavor.has(flavor)) {
        const artifacts = await artifactLock.acquire(flavor, () =>
          Dependencies.downloadArtifactsAsync({
            reactNativeVersion: ctx.reactNativeVersion,
            hermesVersion: ctx.hermesVersion,
            artifactsPath: ctx.artifactsPath,
            buildFlavor: flavor,
            localTarballs: {
              reactNative: resolveFlavorTemplatedPath(
                request.localTarballTemplates.reactNative,
                flavor
              ),
              hermes: resolveFlavorTemplatedPath(request.localTarballTemplates.hermes, flavor),
              reactNativeDependencies: resolveFlavorTemplatedPath(
                request.localTarballTemplates.reactNativeDependencies,
                flavor
              ),
            },
            skipArtifacts: request.skipArtifacts,
          })
        );
        ctx.artifactsByFlavor.set(flavor, artifacts);
      }

      // --- Product loop ---
      for (const product of spmConfig.products) {
        if (ctx.cancelled) break;

        if (request.productFilter && request.productFilter !== product.name) {
          continue;
        }

        ctx.currentProduct = product;

        const unitStatus = createUnitStatus(pkg.packageName, product.name, flavor);
        ctx.statuses.push(unitStatus);

        const unitStart = Date.now();
        let skipRemaining = false;

        // --- Product-scope steps ---
        for (const step of steps.product) {
          if (skipRemaining) {
            continue;
          }

          const outcome = await executeStep(step, ctx);
          if (outcome === 'stop-run') {
            unitStatus.elapsedMs = Date.now() - unitStart;
            stopRun = true;
            break;
          }
          if (outcome === 'skip-remaining') {
            skipRemaining = true;
          }
        }

        unitStatus.elapsedMs = Date.now() - unitStart;
        if (stopRun) break;
      }
      if (stopRun) break;
    }
  }

  return {
    packageName: pkg.packageName,
    statuses: ctx.statuses,
    errors: ctx.errors,
    stopRun,
  };
}

export async function runPrebuildPipeline(
  ctx: PrebuildContext,
  steps: PipelineSteps = defaultSteps
): Promise<PrebuildRunResult> {
  const startTime = Date.now();

  try {
    // --- Run-scope steps (always sequential) ---
    for (const step of steps.run) {
      const outcome = await executeStep(step, ctx);
      if (outcome === 'stop-run') {
        return finalize(ctx, startTime, 1);
      }
    }

    const { packages, request } = ctx;

    if (packages.length === 0) {
      return finalize(ctx, startTime, 0);
    }

    // --- Parallel package execution ---
    const artifactLock = new ArtifactLock();
    const concurrency = Math.min(request.concurrency, packages.length);

    if (concurrency > 1) {
      logger.info(
        `\n⚡ Building ${packages.length} packages with concurrency ${chalk.green(String(concurrency))}`
      );
    }

    // Assign stable indices for banner display (topological order)
    const packageIndices = new Map<string, number>();
    for (let i = 0; i < packages.length; i++) {
      packageIndices.set(packages[i].packageName, i);
    }

    const results = await runPackagesInParallel(
      packages,
      ctx.dependsOn,
      concurrency,
      ctx.abortController,
      (pkg, signal, failedDeps) => {
        if (failedDeps && failedDeps.length > 0) {
          logger.info(
            `⏭️  Skipping ${chalk.yellow(pkg.packageName)} — dependency failed: ${chalk.yellow(failedDeps.join(', '))}`
          );
          return Promise.resolve(
            synthesizeSkippedResult(
              pkg,
              failedDeps,
              ctx.request.buildFlavors,
              ctx.request.productFilter
            )
          );
        }
        return executePackageSteps(
          pkg,
          packageIndices.get(pkg.packageName) ?? 0,
          packages.length,
          ctx,
          steps,
          artifactLock,
          signal
        );
      }
    );

    // Merge results into root context
    for (const result of results) {
      ctx.statuses.push(...result.statuses);
      ctx.errors.push(...result.errors);
    }

    const hasFailures = ctx.errors.length > 0;
    return finalize(ctx, startTime, hasFailures ? 1 : 0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.log(`❌ ${err.message}`);
    return finalize(ctx, startTime, 1);
  }
}

// ---------------------------------------------------------------------------
// Finalize
// ---------------------------------------------------------------------------

function finalize(ctx: PrebuildContext, startTime: number, exitCode: number): PrebuildRunResult {
  const elapsedMs = Date.now() - startTime;

  printPrebuildSummary(ctx.statuses, elapsedMs);

  let errorLogPath: string | undefined;
  if (ctx.errors.length > 0 && !ctx.suppressErrorLog) {
    errorLogPath = writeErrorLog(PACKAGES_DIR, ctx.errors);
    logger.info(`\n📝 Error log written to: ${chalk.yellow(errorLogPath)}`);
  }

  return {
    exitCode,
    elapsedMs,
    statuses: ctx.statuses,
    errors: ctx.errors,
    errorLogPath,
  };
}
