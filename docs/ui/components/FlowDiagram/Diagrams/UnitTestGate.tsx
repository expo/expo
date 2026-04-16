import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'tests',
    position: { x: 10, y: 35 },
    label: 'Unit tests',
    secondaryLabel: 'Custom job',
    badge: 'Runs first',
    accent: 'green',
  },
  {
    id: 'pass',
    position: { x: 230, y: 0 },
    label: 'Tests pass',
    secondaryLabel: 'Continue workflow',
    accent: 'blue',
  },
  {
    id: 'fail',
    position: { x: 230, y: 100 },
    label: 'Tests fail',
    secondaryLabel: 'Workflow stops',
    accent: 'red',
  },
  {
    id: 'pipeline',
    position: { x: 450, y: 0 },
    label: 'Build pipeline',
    secondaryLabel: 'fingerprint → get-build → build',
    accent: 'blue',
  },
  {
    id: 'no-build',
    position: { x: 450, y: 100 },
    label: 'No build created',
    secondaryLabel: 'Broken code blocked',
    accent: 'red',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-tests-pass', source: 'tests', target: 'pass', label: 'Pass' },
  { id: 'e-tests-fail', source: 'tests', target: 'fail', label: 'Fail' },
  { id: 'e-pass-pipeline', source: 'pass', target: 'pipeline' },
  { id: 'e-fail-nobuild', source: 'fail', target: 'no-build', dashed: true },
];

export function UnitTestGate() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={210}
      alt="Unit tests run first as a custom job. If tests pass, the build pipeline continues. If tests fail, the workflow stops and no build is created."
    />
  );
}
