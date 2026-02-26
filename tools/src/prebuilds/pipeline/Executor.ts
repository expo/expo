/**
 * Pipeline executor — sequential dispatch loop with error policy enforcement.
 *
 * Orchestration:
 *   run-scope steps → for each package → package-scope steps
 *     → for each flavor → download artifacts → for each product → product-scope steps
 *   → report summary → return PrebuildRunResult
 */
import chalk from 'chalk';
import path from 'path';

import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { Dependencies } from '../Dependencies';
import { Frameworks } from '../Frameworks';

import type { PrebuildContext } from './Context';
import { packageSteps } from './PackageSteps';
import { productSteps } from './ProductSteps';
import { printPrebuildSummary, writeErrorLog } from './Reporter';
import { runSteps, resolveFlavorTemplatedPath } from './RunSteps';
import type { PrebuildRunResult, Step, UnitStatus, ProductStage } from './Types';

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
// Step runner
// ---------------------------------------------------------------------------

async function executeStep(
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
// Main pipeline
// ---------------------------------------------------------------------------

export async function runPrebuildPipeline(ctx: PrebuildContext): Promise<PrebuildRunResult> {
  const startTime = Date.now();

  try {
    // --- Run-scope steps ---
    for (const step of runSteps) {
      const outcome = await executeStep(step, ctx);
      if (outcome === 'stop-run') {
        return finalize(ctx, startTime, 1);
      }
    }

    const { packages, request } = ctx;
    const totalPackages = packages.length;

    // --- Package loop ---
    for (let pi = 0; pi < totalPackages; pi++) {
      if (ctx.cancelled) break;

      const pkg = packages[pi];
      ctx.currentPackage = pkg;

      const spmConfig = pkg.getSwiftPMConfiguration();
      const flavorInfo =
        request.buildFlavors.length > 1
          ? ` [${request.buildFlavors.join(' + ')}]`
          : ` [${request.buildFlavors[0]}]`;

      logger.info(
        `\n📦 [${pi + 1}/${totalPackages}] ${chalk.green(pkg.packageName)}${flavorInfo}`
      );
      logger.info(`${'─'.repeat(60)}`);

      // Log path summary for verification
      const relPath = (p: string) => path.relative(process.cwd(), p);
      logger.info(`   ・Package:      ${chalk.dim(relPath(pkg.path))}`);
      logger.info(`   ・Build:        ${chalk.dim(relPath(pkg.buildPath))}`);
      logger.info(`   ・Cache:        ${chalk.dim(relPath(ctx.artifactsPath))}`);
      logger.info(
        `   ・XCFrameworks: ${chalk.dim(relPath(Frameworks.getFrameworksOutputPath(pkg.buildPath, request.buildFlavors[0])).replace(`/${request.buildFlavors[0].toLowerCase()}`, '/<flavor>'))}`
      );

      // --- Package-scope steps ---
      let skipPackage = false;
      for (const step of packageSteps) {
        const outcome = await executeStep(step, ctx);
        if (outcome === 'stop-run') {
          return finalize(ctx, startTime, 1);
        }
        if (outcome === 'skip-remaining') {
          skipPackage = true;
          break;
        }
      }
      if (skipPackage) continue;

      // --- Flavor loop ---
      for (const flavor of request.buildFlavors) {
        if (ctx.cancelled) break;

        ctx.currentFlavor = flavor;

        // Download artifacts (once per flavor, cached in ctx.artifactsByFlavor)
        if (!ctx.artifactsByFlavor.has(flavor)) {
          const artifacts = await Dependencies.downloadArtifactsAsync({
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
          });
          ctx.artifactsByFlavor.set(flavor, artifacts);
        }

        // --- Product loop ---
        for (const product of spmConfig.products) {
          if (ctx.cancelled) break;

          // Filter by product name if specified
          if (request.productFilter && request.productFilter !== product.name) {
            continue;
          }

          ctx.currentProduct = product;

          // Create UnitStatus for this package/product/flavor
          const unitStatus = createUnitStatus(pkg.packageName, product.name, flavor);
          ctx.statuses.push(unitStatus);

          const unitStart = Date.now();
          let skipRemaining = false;

          // --- Product-scope steps ---
          for (const step of productSteps) {
            if (skipRemaining) {
              // Leave stage as 'skipped'
              continue;
            }

            const outcome = await executeStep(step, ctx);
            if (outcome === 'stop-run') {
              unitStatus.elapsedMs = Date.now() - unitStart;
              return finalize(ctx, startTime, 1);
            }
            if (outcome === 'skip-remaining') {
              skipRemaining = true;
            }
          }

          unitStatus.elapsedMs = Date.now() - unitStart;
        }
      }
    }

    // Determine exit code based on errors
    const hasFailures = ctx.errors.length > 0;
    return finalize(ctx, startTime, hasFailures ? 1 : 0);
  } catch (error) {
    // Unexpected top-level error
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
  if (ctx.errors.length > 0) {
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
