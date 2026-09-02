import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'workflow-file',
    position: { x: 10, y: 30 },
    label: 'Workflow file',
    secondaryLabel: 'name, trigger, jobs',
    badge: '.eas/workflows/*.yml',
    accent: 'amber',
  },
  {
    id: 'prepackaged',
    position: { x: 280, y: 0 },
    label: 'Pre-packaged job',
    secondaryLabel: 'type: build',
    badge: 'build, submit, update, deploy',
    accent: 'blue',
  },
  {
    id: 'custom',
    position: { x: 280, y: 120 },
    label: 'Custom job',
    secondaryLabel: 'steps: [run: ...]',
    badge: 'shell commands, scripts, tests',
    accent: 'green',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-workflow-prepackaged', source: 'workflow-file', target: 'prepackaged', label: 'type' },
  { id: 'e-workflow-custom', source: 'workflow-file', target: 'custom', label: 'steps' },
];

export function JobTypes() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={240}
      alt="A workflow file contains a name, trigger, and jobs. Jobs are either pre-packaged (using type field) or custom (using steps with run commands)."
    />
  );
}
