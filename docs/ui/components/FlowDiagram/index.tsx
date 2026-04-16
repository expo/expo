import { mergeClasses } from '@expo/styleguide';
import {
  ConnectionMode,
  Edge,
  Node,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import { DottedBackground } from './DottedBackground';
import { TutorialNode } from './TutorialNode';

export type DiagramNode = {
  id: string;
  position: { x: number; y: number };
  label: string;
  secondaryLabel?: string;
  badge?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red' | 'default';
};

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  dashed?: boolean;
};

type FlowDiagramProps = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  height?: number;
  minWidth?: number;
  alt: string;
};

function toReactFlowNodes(diagramNodes: DiagramNode[]): Node[] {
  return diagramNodes.map(node => ({
    id: node.id,
    data: {
      label: node.label,
      secondaryLabel: node.secondaryLabel,
      badge: node.badge,
      accent: node.accent ?? 'default',
    },
    position: node.position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    type: 'tutorialNode',
  }));
}

function toReactFlowEdges(diagramEdges: DiagramEdge[]): Edge[] {
  return diagramEdges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    labelStyle: { fontSize: 12, fontWeight: 600, fill: 'var(--expo-theme-text-secondary)' },
    labelBgStyle: { fill: 'var(--expo-theme-background-default)' },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
    style: {
      strokeWidth: 2,
      stroke: edge.dashed
        ? 'var(--expo-theme-border-default)'
        : 'var(--expo-theme-text-quaternary)',
      ...(edge.dashed ? { strokeDasharray: 4 } : {}),
    },
  }));
}

const nodeTypes = {
  tutorialNode: TutorialNode,
};

export function FlowDiagram({ nodes, edges, height = 320, minWidth = 700, alt }: FlowDiagramProps) {
  const [rfNodes] = useNodesState(toReactFlowNodes(nodes));
  const [rfEdges] = useEdgesState(toReactFlowEdges(edges));

  return (
    <div
      className={mergeClasses(
        'border-default bg-default mb-4 w-full overflow-x-auto overflow-y-hidden rounded-lg border'
      )}
      data-md="diagram"
      data-md-alt={alt}>
      <div className="relative" style={{ height, minWidth }}>
        <DottedBackground />
        <ReactFlow
          disableKeyboardA11y
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          preventScrolling={false}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          zoomOnPinch={false}
          connectionMode={ConnectionMode.Strict}
          fitView
          fitViewOptions={{
            padding: 0.15,
            minZoom: 0.25,
            maxZoom: 1,
          }}
          attributionPosition="bottom-right"
        />
      </div>
    </div>
  );
}
