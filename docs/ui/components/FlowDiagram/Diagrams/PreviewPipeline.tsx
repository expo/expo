import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'fingerprint',
    position: { x: 10, y: 20 },
    label: 'Fingerprint',
    secondaryLabel: 'environment: preview',
    accent: 'amber',
  },
  {
    id: 'get-build',
    position: { x: 250, y: 20 },
    label: 'Get build',
    secondaryLabel: 'Check existing build',
    accent: 'amber',
  },
  {
    id: 'build',
    position: { x: 490, y: 20 },
    label: 'Build',
    secondaryLabel: 'Success, fail, or skip',
    accent: 'blue',
  },
  {
    id: 'slack',
    position: { x: 720, y: 20 },
    label: 'Slack notification',
    secondaryLabel: 'Notify status to team',
    accent: 'green',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-fp-gb', source: 'fingerprint', target: 'get-build' },
  { id: 'e-gb-build', source: 'get-build', target: 'build' },
  { id: 'e-build-slack', source: 'build', target: 'slack' },
];

export function PreviewPipeline() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={140}
      alt="Preview workflow pipeline: fingerprint checks native changes, get-build checks for existing builds, then creates a new preview build with Slack notification."
    />
  );
}
