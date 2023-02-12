import { Command } from '@expo/commander';

import { DependencyKind } from '../Packages';
import { PackagesGraph, printGraph, printNodeDependents } from '../packages-graph';

type ActionOptions = {
  dev: boolean;
  peer: boolean;
  listDependentsOf: string;
};

async function action(packageNames: string[], options: ActionOptions) {
  const graph = await PackagesGraph.makeFromPublicPackages();
  const dependencyKinds = [
    DependencyKind.Normal,
    options.dev && DependencyKind.Dev,
    options.peer && DependencyKind.Peer,
  ].filter(Boolean) as DependencyKind[];

  if (options.listDependentsOf) {
    const packageName = options.listDependentsOf;
    const node = graph.getNode(packageName);

    if (!node) {
      throw new Error(`Package with name "${packageName}" not found`);
    }
    printNodeDependents(node, dependencyKinds);
    return;
  }

  printGraph(graph, packageNames, dependencyKinds);
}

export default (program: Command) => {
  program
    .command('packages-dependency-graph [packageNames...]')
    .alias('pdg')
    .option('--dev', 'Whether to include dev dependencies', false)
    .option('--peer', 'Whether to include peer dependencies', false)
    .option('--list-dependents-of <packageName>', 'Lists all dependents of the given package', '')
    .asyncAction(action);
};
