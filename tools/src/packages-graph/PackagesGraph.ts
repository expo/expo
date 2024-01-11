import chalk from 'chalk';

import PackagesGraphEdge from './PackagesGraphEdge';
import PackagesGraphNode from './PackagesGraphNode';
import {
  DefaultDependencyKind,
  DependencyKind,
  getListOfPackagesAsync,
  Package,
} from '../Packages';

type PackagesMap = Map<string, PackagesGraphNode>;

export default class PackagesGraph {
  nodes: PackagesMap = new Map();

  static async makeFromPublicPackages(): Promise<PackagesGraph> {
    const packages = await getListOfPackagesAsync();
    const graph = new PackagesGraph(packages.filter((pkg) => pkg.packageJson.private !== true));
    return graph;
  }

  constructor(packages: Package[]) {
    for (const pkg of packages) {
      const node = new PackagesGraphNode(pkg);
      this.nodes.set(pkg.packageName, node);
    }
    for (const node of this.nodes.values()) {
      resolveDependencies(this, node);
    }
  }

  getNode(packageName: string): PackagesGraphNode | null {
    return this.nodes.get(packageName) ?? null;
  }

  getOriginNodes(): PackagesGraphNode[] {
    return [...this.nodes.values()].filter((node) => node.depth === 0);
  }
}

function resolveDependencies(
  graph: PackagesGraph,
  node: PackagesGraphNode,
  visitedNodes: Record<string, boolean> = {}
) {
  const dependencies = node.pkg.getDependencies([
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
    DependencyKind.Optional,
  ]);

  // Mark the node as visited.
  visitedNodes[node.name] = true;

  for (const dependency of dependencies) {
    const dependencyNode = graph.getNode(dependency.name);

    if (!dependencyNode) {
      // The dependency is probably not our package, so just skip it.
      continue;
    }
    addDependency(
      graph,
      node,
      dependencyNode,
      dependency.kind,
      dependency.versionRange,
      visitedNodes
    );
  }
}

function addDependency(
  graph: PackagesGraph,
  origin: PackagesGraphNode,
  destination: PackagesGraphNode,
  kind: DependencyKind = DependencyKind.Normal,
  versionRange: string,
  visitedNodes: Record<string, boolean> = {}
) {
  const existingEdge = origin.getOutgoingEdgeForNode(destination);

  // Given nodes are already connected in that direction.
  // Just make sure to add another kind.
  if (existingEdge) {
    existingEdge.addKind(kind);
    return;
  }

  const edge = new PackagesGraphEdge(origin, destination, versionRange);

  edge.addKind(kind);

  // If the target node was already visited, mark the edge as a cycling edge.
  edge.isCyclic = visitedNodes[destination.name] === true;

  // Connect nodes.
  origin.outgoingEdges.push(edge);
  destination.incomingEdges.push(edge);

  // The dependency node is at least one level deeper than the parent.
  destination.depth = Math.max(origin.depth + 1, destination.depth);

  if (edge.isCyclic) {
    // Possible cycle in dependencies. Cycles in peer and optional dependency relations are fine though.
    if (DefaultDependencyKind.includes(kind)) {
      console.error(
        chalk.red(`Detected a cycle in ${kind}! ${origin.name} -> ${destination.name}`)
      );
    }
    return;
  }
  resolveDependencies(graph, destination, { ...visitedNodes });
}
