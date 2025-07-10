import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import React from 'react';
import '@xyflow/react/dist/style.css';

type ConfigPluginHierarchyProps = {
  highlightedNodeId?: string;
  highlightedNodeIds?: string[];
};

const nodeHandleStyles = `
  .react-flow__handle {
    background-color: #94a3b8 !important;
    border: 1px solid #94a3b8 !important;
  }

  .react-flow__attribution {
    background-color: var(--palette-gray2) !important;
    color: var(--palette-gray11) !important;
    border: 1px solid var(--palette-gray6) !important;
  }

  .react-flow__attribution a {
    color: var(--palette-gray11) !important;
  }
`;

type NodeData = {
  id: string;
  position: { x: number; y: number };
  title: string;
  subtitle?: string;
  badge: string;
  extraTitle?: string;
};

const nodesData: NodeData[] = [
  {
    id: '1',
    position: { x: 50, y: 200 },
    title: 'withMyPlugin',
    subtitle: '"myPlugin"',
    badge: 'Config Plugin',
  },
  {
    id: '2',
    position: { x: 250, y: 200 },
    title: 'withAndroidPlugin',
    extraTitle: 'withIosPlugin',
    badge: 'Plugin Function',
  },
  {
    id: '3',
    position: { x: 450, y: 200 },
    title: 'withAndroidManifest',
    extraTitle: 'withInfoPlist',
    badge: 'Mod Plugin Function',
  },
  {
    id: '4',
    position: { x: 650, y: 200 },
    title: 'mods.android.manifest',
    extraTitle: 'mods.ios.infoplist',
    badge: 'Mod',
  },
];

const getNodeStyles = (isHighlighted: boolean) => ({
  text: isHighlighted ? 'text-palette-green11' : 'text-palette-blue11',
  subtitleText: isHighlighted ? 'text-palette-green10' : 'text-palette-blue10',
  badge: isHighlighted
    ? 'bg-palette-green9 text-palette-white'
    : 'bg-palette-blue9 text-palette-white',
  container: isHighlighted
    ? 'bg-palette-green3 border-palette-green9 border-2 dark:bg-palette-green4 dark:border-palette-green8 !border-palette-green9 dark:!border-palette-green8 !bg-palette-green3 dark:!bg-palette-green4'
    : 'bg-palette-blue3 border-palette-blue9 border-2 dark:bg-palette-blue4 dark:border-palette-blue8 !border-palette-blue9 dark:!border-palette-blue8 !bg-palette-blue3 dark:!bg-palette-blue4',
});

const createNodeLabel = (data: NodeData, isHighlighted: boolean) => {
  const styles = getNodeStyles(isHighlighted);

  return (
    <div className="text-center">
      <div
        className={`${data.extraTitle ? 'mb-1' : ''} ${isHighlighted ? 'font-bold' : ''} ${styles.text}`}>
        {data.title}
      </div>
      {data.extraTitle && (
        <div className={`${isHighlighted ? 'font-bold' : ''} ${styles.text}`}>
          {data.extraTitle}
        </div>
      )}
      {data.subtitle && <div className={`text-xs ${styles.subtitleText}`}>{data.subtitle}</div>}
      <div className={`mt-1 rounded-md px-2 py-1 text-xs ${styles.badge}`}>{data.badge}</div>
    </div>
  );
};

const createNodes = (highlightedNodeId?: string, highlightedNodeIds?: string[]): Node[] => {
  const highlightedIds = new Set([
    ...(highlightedNodeId ? [highlightedNodeId] : []),
    ...(highlightedNodeIds ?? []),
  ]);

  return nodesData.map(nodeData => {
    const isHighlighted = highlightedIds.has(nodeData.id);
    const styles = getNodeStyles(isHighlighted);

    return {
      id: nodeData.id,
      type: 'default',
      position: nodeData.position,
      data: { label: createNodeLabel(nodeData, isHighlighted) },
      style: {
        borderRadius: '8px',
        padding: '10px',
        minWidth: '150px',
      },
      className: styles.container,
      draggable: false,
      selectable: false,
    };
  });
};

const createEdge = (id: string, source: string, target: string): Edge => ({
  id,
  source,
  target,
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#94a3b8',
  },
});

const initialEdges: Edge[] = [
  createEdge('e1-2', '1', '2'),
  createEdge('e2-3', '2', '3'),
  createEdge('e3-4', '3', '4'),
];

export const ConfigPluginHierarchy: React.FC<ConfigPluginHierarchyProps> = ({
  highlightedNodeId,
  highlightedNodeIds,
}) => {
  const [nodes, setNodes] = useNodesState(createNodes(highlightedNodeId, highlightedNodeIds));
  const [edges] = useEdgesState(initialEdges);

  React.useEffect(() => {
    setNodes(createNodes(highlightedNodeId, highlightedNodeIds));
  }, [highlightedNodeId, highlightedNodeIds, setNodes]);

  return (
    <div className="mb-4 h-[300px] w-full overflow-hidden rounded-lg border border-default bg-default">
      <style dangerouslySetInnerHTML={{ __html: nodeHandleStyles }} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}>
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.3} />
      </ReactFlow>
    </div>
  );
};
