import React from 'react';

import { useRouteNode } from '../Route';
import { Toast, ToastWrapper } from './Toast';

export function EmptyRoute() {
  const route = useRouteNode();

  return (
    <ToastWrapper>
      <Toast warning filename={route?.contextKey}>
        Missing default export
      </Toast>
    </ToastWrapper>
  );
}
