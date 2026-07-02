import { styleText } from 'node:util';
import { EOL } from 'os';

import PackagesGraph from './PackagesGraph';
import PackagesGraphEdge from './PackagesGraphEdge';
import PackagesGraphNode from './PackagesGraphNode';
import { DefaultDependencyKind, DependencyKind } from '../Packages';

type NodeVisitingData = {
  visited: Record<string, boolean>;
  node: PackagesGraphNode;
  edges: PackagesGraphEdge[];
  kind: DependencyKind;
  version: string;
  level: number;
  prefix: string;
};

export function printGraph(
  graph: PackagesGraph,
  packageNames: string[] = [],
  kinds: DependencyKind[] = DefaultDependencyKind
) {
  function visitNodeEdges(visitingData: NodeVisitingData) {
    const { node, edges, kind, version, level, prefix, visited } = visitingData;
    const name = formatNodeName(node.name, kind, level);

    if (visited[node.name] === true) {
      process.stdout.write(styleText('dim', `${name} ...`) + EOL);
      return;
    }

    visited[node.name] = true;

    process.stdout.write(`${name} ${styleText('cyan', version)}` + EOL);

    if (edges.length === 0 && level === 0) {
      // It has no dependencies, but let's explicitly show that for the origin nodes.
      process.stdout.write(edgePointer(true, false, false) + styleText('dim', 'none') + EOL);
      return;
    }
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const isLast = i === edges.length - 1;
      const nextEdges = edge.destination.getOutgoingEdgesOfKinds(kinds);
      const hasMore = nextEdges.length > 0 && visited[edge.destination.name] !== true;

      process.stdout.write(styleText('gray', prefix) + edgePointer(isLast, hasMore, edge.isCyclic));

      visitNodeEdges({
        node: edge.destination,
        edges: nextEdges,
        kind: edge.getDominantKind(),
        version: edge.versionRange,
        level: level + 1,
        prefix: prefix + nodeIndent(isLast),
        visited: { ...visited },
      });
    }
  }

  for (const node of graph.nodes.values()) {
    if (packageNames.length > 0 && !packageNames.includes(node.name)) {
      continue;
    }
    visitNodeEdges({
      node,
      edges: node.getOutgoingEdgesOfKinds(kinds),
      kind: DependencyKind.Normal,
      version: node.pkg.packageVersion,
      level: 0,
      prefix: '',
      visited: {},
    });
  }
}

export function printNodeDependents(
  node: PackagesGraphNode,
  kinds: DependencyKind[] = DefaultDependencyKind
) {
  const nodes = node.getAllDependents(kinds);

  if (nodes.length === 0) {
    console.log(`${styleText('bold', node.name)} has no dependents`);
    return;
  }

  console.log(`All dependents of the ${styleText('bold', node.name)} package:`);

  for (const node of nodes) {
    console.log(`- ${styleText('bold', node.name)}`);
  }
}

function edgePointer(isLast: boolean, hasMore: boolean, isCyclic: boolean): string {
  const rawPointer = [
    isLast ? '└─' : '├─',
    hasMore ? '┬─' : '──',
    isCyclic ? styleText('red', '∞') : '',
    ' ',
  ].join('');
  return styleText('gray', rawPointer);
}

function nodeIndent(isLast: boolean): string {
  return isLast ? '  ' : '│ ';
}

function formatNodeName(name: string, kind: DependencyKind, level: number): string {
  if (level === 0) {
    return styleText('bold', name);
  }
  switch (kind) {
    case DependencyKind.Normal:
      return styleText('green', name);
    case DependencyKind.Dev:
      return styleText('yellow', name);
    case DependencyKind.Peer:
      return styleText('magenta', name);
    case DependencyKind.Optional:
      return styleText('gray', name);
  }
}
