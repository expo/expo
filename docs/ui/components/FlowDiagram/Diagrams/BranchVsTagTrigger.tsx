import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'branch-trigger',
    position: { x: 10, y: 20 },
    label: 'Push to release/*',
    secondaryLabel: 'Any commit on a release branch',
    badge: 'Before',
    accent: 'amber',
  },
  {
    id: 'branch-runs',
    position: { x: 320, y: 20 },
    label: 'Workflow runs',
    secondaryLabel: 'On every push',
    accent: 'amber',
  },
  {
    id: 'tag-trigger',
    position: { x: 10, y: 150 },
    label: 'Push v*.*.* tag',
    secondaryLabel: 'A named point in history',
    badge: 'After',
    accent: 'green',
  },
  {
    id: 'tag-runs',
    position: { x: 320, y: 150 },
    label: 'Workflow runs',
    secondaryLabel: 'Only when a tag is pushed',
    accent: 'green',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-branch-runs', source: 'branch-trigger', target: 'branch-runs' },
  { id: 'e-tag-runs', source: 'tag-trigger', target: 'tag-runs' },
];

export function BranchVsTagTrigger() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={250}
      alt="Trigger comparison: a push to a release branch runs the production workflow on every commit, while a push of a version tag runs the workflow only when a tag is pushed."
    />
  );
}
