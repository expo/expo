'use client';

import React from 'react';

import { Toast, ToastWrapper } from './Toast';
import { useRouteNode } from '../Route';

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
