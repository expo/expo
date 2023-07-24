import React from "react";

import { RouteNode } from "../Route";
import { Toast, ToastWrapper } from "./Toast";

export function SuspenseFallback({ route }: { route: RouteNode }) {
  return (
    <ToastWrapper>
      <Toast filename={route?.contextKey}>Bundling...</Toast>
    </ToastWrapper>
  );
}
