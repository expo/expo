import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'trigger',
    position: { x: 10, y: 60 },
    label: 'Push to release/*',
    secondaryLabel: 'Workflow trigger',
    accent: 'default',
  },
  {
    id: 'fingerprint',
    position: { x: 250, y: 60 },
    label: 'Fingerprint',
    secondaryLabel: 'Hash native characteristics',
    accent: 'amber',
  },
  {
    id: 'get-build',
    position: { x: 490, y: 60 },
    label: 'Get build',
    secondaryLabel: 'Look up existing build',
    accent: 'amber',
  },
  {
    id: 'match',
    position: { x: 730, y: 60 },
    label: 'Hash matches?',
    secondaryLabel: 'Same fingerprint exists',
    badge: 'Decision',
    accent: 'amber',
  },
  {
    id: 'update',
    position: { x: 970, y: 0 },
    label: 'Publish update',
    secondaryLabel: 'OTA update via update job',
    accent: 'green',
  },
  {
    id: 'build',
    position: { x: 970, y: 130 },
    label: 'Run build',
    secondaryLabel: 'New native build via build job',
    accent: 'blue',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-trigger-fp', source: 'trigger', target: 'fingerprint' },
  { id: 'e-fp-gb', source: 'fingerprint', target: 'get-build' },
  { id: 'e-gb-match', source: 'get-build', target: 'match' },
  { id: 'e-match-update', source: 'match', target: 'update', label: 'Yes' },
  { id: 'e-match-build', source: 'match', target: 'build', label: 'No' },
];

export function BuildOrUpdate() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={220}
      alt="Production workflow decision: a push to a release branch fires the workflow, fingerprint hashes the project, get-build looks up an existing build with the same hash, then the workflow publishes an OTA update if a match is found, or runs a new native build if not."
    />
  );
}
