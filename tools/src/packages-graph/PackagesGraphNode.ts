import PackagesGraphEdge from './PackagesGraphEdge';
import { DefaultDependencyKind, DependencyKind, Package } from '../Packages';

/**
 * A graph node that refers to the single package.
 */
export default class PackagesGraphNode {
  /**
   * The package represented by the node.
   */
  pkg: Package;

  /**
   * The package name.
   */
  name: string;

  /**
   * Indicates how deep the node is placed in the graph.
   * Depth of nodes without incoming edges is equal to `0`.
   */
  depth: number = 0;

  /**
   * Edges connecting this node with its dependencies.
   */
  outgoingEdges: PackagesGraphEdge[] = [];

  /**
   * Edges connecting this node with its dependents.
   */
  incomingEdges: PackagesGraphEdge[] = [];

  constructor(pkg: Package) {
    this.pkg = pkg;
    this.name = pkg.packageName;
  }

  getOutgoingEdgeForNode(node: PackagesGraphNode): PackagesGraphEdge | null {
    return this.outgoingEdges.find((edge) => edge.destination === node) ?? null;
  }

  getIncomingEdgeForNode(node: PackagesGraphNode): PackagesGraphEdge | null {
    return this.incomingEdges.find((edge) => edge.origin === node) ?? null;
  }

  getAllDependentEdges(kinds: DependencyKind[] = DefaultDependencyKind): PackagesGraphEdge[] {
    const allDependentEdges = this.incomingEdges
      .map((edge) => {
        if (!edge.isCyclic && kinds.includes(edge.getDominantKind())) {
          return [edge, ...edge.origin.getAllDependentEdges(kinds)];
        }
        return [];
      })
      .flat();

    return [...new Set(allDependentEdges)];
  }

  getAllDependents(kinds: DependencyKind[] = DefaultDependencyKind): PackagesGraphNode[] {
    return [...new Set(this.getAllDependentEdges(kinds).map((edge) => edge.origin))];
  }

  getAllDependencyEdges(kinds: DependencyKind[] = DefaultDependencyKind): PackagesGraphEdge[] {
    const allDependencyEdges = this.outgoingEdges
      .map((edge) => {
        if (!edge.isCyclic && kinds.includes(edge.getDominantKind())) {
          return [edge, ...edge.destination.getAllDependencyEdges(kinds)];
        }
        return [];
      })
      .flat();

    return [...new Set(allDependencyEdges)];
  }

  getAllDependencies(kinds: DependencyKind[] = DefaultDependencyKind): PackagesGraphNode[] {
    return [...new Set(this.getAllDependencyEdges(kinds).map((edge) => edge.destination))];
  }

  getOutgoingEdgesOfKinds(kinds: DependencyKind[]): PackagesGraphEdge[] {
    return this.outgoingEdges.filter((edge) => {
      return kinds.some((kind) => edge.isOfKind(kind));
    });
  }

  isDependentOf(node: PackagesGraphNode): boolean {
    return !!this.getOutgoingEdgeForNode(node);
  }

  isDependencyOf(node: PackagesGraphNode): boolean {
    return !!this.getIncomingEdgeForNode(node);
  }
}
