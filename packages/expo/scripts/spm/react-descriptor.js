/**
 * Rendering helpers for React's SwiftPM wiring, derived from `context.react`
 * (the ReactDescriptor RN passes). Pure string producers — no I/O — so the
 * generated Package.swift fragments are unit-testable.
 */

'use strict';

/** Render the React package ref (ReactDescriptor.packageRef) as a Package.swift `.package(...)`. */
function reactPackageDependency(react) {
  const ref = react.packageRef;
  if (ref.url != null) {
    return `.package(url: "${ref.url}", exact: "${ref.version}")`;
  }
  return `.package(name: "${ref.name}", path: "${ref.path}")`;
}

/** Render the React product set (ReactDescriptor.products) as target `.product(...)` deps. */
function reactProductDependencies(react) {
  const deps = react.products.map((p) => `.product(name: "${p.name}", package: "${p.package}")`);
  // hermes-engine isn't in the ReactDescriptor's product set, but React-consuming code that pulls
  // in reacthermes (HermesExecutorFactory) needs <hermes/hermes.h>. It's a product of the same
  // (ReactNative) package. TODO: fold into RN's reactProducts() so the descriptor carries it.
  deps.push(`.product(name: "hermes-engine", package: "${react.packageRef.name}")`);
  return deps;
}

/**
 * Package `.package(...)` declarations for EVERY package referenced by the React products —
 * `packageRef` covers "ReactNative", but some products (ReactAppHeaders) live in the separate,
 * per-app "React-GeneratedCode" package, which the ReactDescriptor doesn't hand us a ref for.
 * Its location is RN's convention: `<outputDir>/../ios` (the codegen package). We derive it here.
 */
function reactPackageDeclarations(react, codegenPkgPath) {
  const decls = [reactPackageDependency(react)];
  const packages = new Set(react.products.map((p) => p.package));
  if (packages.has('React-GeneratedCode') && codegenPkgPath != null) {
    decls.push(`.package(name: "React-GeneratedCode", path: "${codegenPkgPath}")`);
  }
  return decls;
}

module.exports = {
  reactPackageDependency,
  reactProductDependencies,
  reactPackageDeclarations,
};
