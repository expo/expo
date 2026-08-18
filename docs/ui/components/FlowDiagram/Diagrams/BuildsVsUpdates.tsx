import React from 'react';

import { DiagramEdge, DiagramNode, FlowDiagram } from '..';

const nodes: DiagramNode[] = [
  {
    id: 'decision',
    position: { x: 10, y: 50 },
    label: 'What changed?',
    secondaryLabel: 'Native code or JS-only?',
    badge: 'Decision',
    accent: 'amber',
  },
  {
    id: 'native',
    position: { x: 260, y: 0 },
    label: 'Native change',
    secondaryLabel: 'New library, permissions, SDK upgrade',
    accent: 'green',
  },
  {
    id: 'js',
    position: { x: 260, y: 120 },
    label: 'JS-only change',
    secondaryLabel: 'UI fix, copy change, logic update',
    accent: 'blue',
  },
  {
    id: 'build',
    position: { x: 510, y: 0 },
    label: 'EAS Build',
    secondaryLabel: 'Compiles native code into app binary',
    badge: 'Minutes',
    accent: 'green',
  },
  {
    id: 'update',
    position: { x: 510, y: 120 },
    label: 'EAS Update',
    secondaryLabel: 'Delivers JS changes over-the-air',
    badge: 'Seconds',
    accent: 'blue',
  },
];

const edges: DiagramEdge[] = [
  { id: 'e-decision-native', source: 'decision', target: 'native', label: 'Native' },
  { id: 'e-decision-js', source: 'decision', target: 'js', label: 'JS-only' },
  { id: 'e-native-build', source: 'native', target: 'build' },
  { id: 'e-js-update', source: 'js', target: 'update' },
];

export function BuildsVsUpdates() {
  return (
    <FlowDiagram
      nodes={nodes}
      edges={edges}
      height={260}
      alt="Decision flow: Native changes require EAS Build (minutes). JS-only changes use EAS Update (seconds)."
    />
  );
}
