'use client';

import React from 'react';

import { ctx } from '../../_ctx';
import { ExpoRoot } from '../ExpoRoot';

export default function LegacyExpoRoot({ location }: { location: URL }) {
  return <ExpoRoot location={location} context={ctx}></ExpoRoot>;
}
