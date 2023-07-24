/// <reference types="./index" />

import "@expo/metro-runtime";

import React from "react";

import { ctx } from "./_ctx";
import { ExpoRoot } from "./src";
import { ExpoRootProps } from "./src/ExpoRoot";
import { getNavigationConfig } from "./src/getLinkingConfig";
import { getRoutes } from "./src/getRoutes";
import { loadStaticParamsAsync } from "./src/loadStaticParamsAsync";

// Must be exported or Fast Refresh won't update the context >:[
export default function ExpoRouterRoot(props: Omit<ExpoRootProps, "context">) {
  return <ExpoRoot context={ctx} {...props} />;
}

/** Get the linking manifest from a Node.js process. */
export async function getManifest(options: any) {
  const routeTree = getRoutes(ctx, options);

  if (!routeTree) {
    throw new Error("No routes found");
  }

  // Evaluate all static params
  await loadStaticParamsAsync(routeTree);

  return getNavigationConfig(routeTree);
}

export { ctx };
