import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'fingerprint',
    position: { x: 10, y: 40 },
    label: 'Fingerprint',
    secondaryLabel: 'Hash native characteristics',
    accent: 'amber',
  },
  {
    id: 'match',
    position: { x: 240, y: 40 },
    label: 'Hash matches?',
    secondaryLabel: 'Compare with existing build',
    badge: 'Decision',
    accent: 'amber',
  },
  {
    id: 'skip',
    position: { x: 500, y: 0 },
    label: 'Skip rebuild',
    secondaryLabel: 'Native code unchanged',
    accent: 'green',
  },
  {
    id: 'build',
    position: { x: 500, y: 110 },
    label: 'New build',
    secondaryLabel: 'Native code changed',
    accent: 'blue',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-fingerprint-match', source: 'fingerprint', target: 'match' },
  { id: 'e-match-skip', source: 'match', target: 'skip', label: 'Yes' },
  { id: 'e-match-build', source: 'match', target: 'build', label: 'No' },
];

export function FingerprintFlow() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={200}
      alt="Fingerprint hashes native characteristics. If hash matches an existing build, rebuild is skipped. If hash differs, a new build is created."
    />
  );
}
