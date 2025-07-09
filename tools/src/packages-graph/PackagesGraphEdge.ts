import PackagesGraphNode from './PackagesGraphNode';
import { DependencyKind } from '../Packages';

/**
 * A graph edge that refers to the relation between two packages.
 */
export default class PackagesGraphEdge {
  /**
   * The graph node that depends on the destination node.
   */
  origin: PackagesGraphNode;

  /**
   * The graph node that is dependent of the origin node.
   */
  destination: PackagesGraphNode;

  /**
   * Version range that the origin node package requires on the destination node package.
   */
  versionRange: string;

  /**
   * A set of dependency kinds that connect these two nodes. Usually it's just one kind,
   * but in theory it's possible that the package is both a dependency and dev or peer dependency.
   */
  kinds = new Set<DependencyKind>();

  /**
   * Determines whether the edge is part of the cycle.
   */
  isCyclic: boolean = false;

  constructor(origin: PackagesGraphNode, destination: PackagesGraphNode, versionRange: string) {
    this.origin = origin;
    this.destination = destination;
    this.versionRange = versionRange;
  }

  addKind(kind: DependencyKind) {
    this.kinds.add(kind);
  }

  isOfKind(kind: DependencyKind): boolean {
    return this.kinds.has(kind);
  }

  getDominantKind(): DependencyKind {
    const kindsInImportanceOrder: DependencyKind[] = [
      DependencyKind.Normal,
      DependencyKind.Dev,
      DependencyKind.Peer,
      DependencyKind.Optional,
    ];
    const dominant = kindsInImportanceOrder.find((kind) => this.kinds.has(kind));

    if (!dominant) {
      throw new Error(
        `Cannot find a dominant edge kind between ${this.origin.name} and ${this.destination.name}`
      );
    }
    return dominant;
  }
}
