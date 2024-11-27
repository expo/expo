import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import GithubSlugger from 'github-slugger';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
import { u as node } from 'unist-builder';
import { visit } from 'unist-util-visit';

import { findActiveRoute, Navigation } from './Navigation';
import { NavigationNode } from './types';

import { HeadingManager } from '~/common/headingManager';
import { HeadingsContext } from '~/common/withHeadingManager';

const prepareHeadingManager = () => {
  const headingManager = new HeadingManager(new GithubSlugger(), { headings: [] });

  return headingManager;
};

jest.mock('next/router', () => mockRouter);

/** A set of navigation nodes to test with */
const nodes: NavigationNode[] = [
  node('section', { name: 'Get started' }, [
    node('page', { name: 'Introduction', href: '/introduction' }),
    node('page', { name: 'Create a new app', href: '/introduction/create-new-app' }),
    node('page', { name: 'Errors and debugging', href: '/introduction/not-that-great-tbh' }),
  ]),
  node('section', { name: 'Tutorial' }, [
    node('group', { name: 'First steps' }, [
      node('page', { name: 'Styling text', href: '/tutorial/first-steps/styling-text' }),
      node('page', { name: 'Adding an image', href: '/tutorial/first-steps/adding-images' }),
      node('page', { name: 'Creating a button', href: '/tutorial/creating-button' }),
    ]),
    node('group', { name: 'Building apps' }, [
      node('page', { name: 'Building for store', href: '/build/eas-build' }),
      node('page', { name: 'Submitting to store', href: '/build/eas-submit' }),
    ]),
    node('group', { name: 'Parallel universe', hidden: true }, [
      node('page', { name: 'Create Flutter apps', href: '/parallel-universe/flutter' }),
      node('page', { name: 'Create websites', href: '/parallel-universe/ionic' }),
      node('page', { name: 'Create broken apps', href: '/parallel-universe/microsoft-uwp' }),
    ]),
  ]),
];

describe(Navigation, () => {
  it('renders pages', () => {
    const section = getNode(nodes, { name: 'Get started' });
    render(
      <MemoryRouterProvider>
        <Navigation routes={children(section)} />
      </MemoryRouterProvider>
    );
    // Get started ->
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Create a new app')).toBeInTheDocument();
    expect(screen.getByText('Errors and debugging')).toBeInTheDocument();
  });

  it('renders pages inside groups', () => {
    const section = getNode(nodes, { name: 'Tutorial' });
    render(
      <MemoryRouterProvider>
        <Navigation routes={children(section)} />
      </MemoryRouterProvider>
    );
    // Tutorial ->
    expect(screen.getByText('Building apps')).toBeInTheDocument();
    // Tutorial -> Building apps ->
    expect(screen.getByText('Building for store')).toBeInTheDocument();
    expect(screen.getByText('Submitting to store')).toBeInTheDocument();
  });

  it('renders pages inside groups inside sections', () => {
    const headingManager = prepareHeadingManager();
    render(
      // Need context due to withHeadingManager in Collapsible, which enables anchor links
      <HeadingsContext.Provider value={headingManager}>
        <MemoryRouterProvider>
          <Navigation routes={nodes} />
        </MemoryRouterProvider>
      </HeadingsContext.Provider>
    );
    // Get started ->
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    // Tutorial -> First steps ->
    expect(screen.getByText('Adding an image')).toBeInTheDocument();
    // Tutorial -> Building apps ->
    expect(screen.getByText('Submitting to store')).toBeInTheDocument();
  });
});

describe(findActiveRoute, () => {
  it('finds active page in list', () => {
    const section = getNode(nodes, { name: 'Get started' });
    expect(findActiveRoute(children(section), '/introduction/create-new-app')).toMatchObject({
      page: getNode(section, { name: 'Create a new app' }),
      group: null,
      section: null,
    });
  });

  it('finds active page and group in list', () => {
    const section = getNode(nodes, { name: 'Tutorial' });
    expect(findActiveRoute(children(section), '/build/eas-submit')).toMatchObject({
      page: getNode(section, { name: 'Submitting to store' }),
      group: getNode(section, { name: 'Building apps' }),
      section: null,
    });
  });

  it('finds active page, group, and section in list', () => {
    expect(findActiveRoute(nodes, '/tutorial/first-steps/styling-text')).toMatchObject({
      page: getNode(nodes, { name: 'Styling text' }),
      group: getNode(nodes, { name: 'First steps' }),
      section: getNode(nodes, { name: 'Tutorial' }),
    });
  });

  it('skips hidden navigation node', () => {
    expect(findActiveRoute(nodes, '/parallel-universe/microsoft-uwp')).toMatchObject({
      page: null,
      group: null,
      section: null,
    });
  });
});

/** Helper function to find the first node that matches the predicate */
function getNode(
  list: NavigationNode | NavigationNode[] | null,
  predicate: Partial<NavigationNode> | ((node: NavigationNode) => boolean)
): NavigationNode | null {
  let result = null;
  const tree = Array.isArray(list) ? node('root', list) : list || node('root');
  visit(tree, predicate as any, node => {
    result = node;
  });
  return result;
}

/** Helper function to pull children from the node, if any */
function children(node: NavigationNode | null) {
  switch (node?.type) {
    case 'section':
    case 'group':
      return node.children;
    default:
      return [];
  }
}
