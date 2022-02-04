import React from 'react';
import node from 'unist-builder';
import visit from 'unist-util-visit';

import { findActiveRoute } from './Navigation';
import { NavigationNode } from './types';

describe(findActiveRoute, () => {
  it('finds active page in list', () => {
    const list = [
      node('page', { name: 'Page 1', href: '/build' }),
      node('page', { name: 'Page 2', href: '/build/setup' }),
      node('page', { name: 'Page 3', href: '/build/eas-json' }),
    ];
    expect(findActiveRoute(list, '/build/setup')).toMatchObject({
      page: findNode(list, { type: 'page', name: 'Page 2' }),
      group: null,
      section: null,
    });
  });

  it('finds active page and group in list', () => {
    const list = [
      node('group', { name: 'Group 1' }, []),
      node('group', { name: 'Group 2' }, [
        node('page', { name: 'Page 1', href: '/build' }),
        node('page', { name: 'Page 2', href: '/build/setup' }),
        node('page', { name: 'Page 3', href: '/build/eas-json' }),
      ]),
    ];
    expect(findActiveRoute(list, '/build/eas-json')).toMatchObject({
      page: findNode(list, { type: 'page', name: 'Page 3' }),
      group: findNode(list, { type: 'group', name: 'Group 2' }),
      section: null,
    });
  });

  it('finds active page, group, and section in list', () => {
    const list = [
      node('section', { name: 'Section 1' }, [
        node('group', { name: 'Group 1' }, []),
        node('group', { name: 'Group 2' }, [
          node('page', { name: 'Page 1', href: '/build' }),
          node('page', { name: 'Page 2', href: '/build/flutter' }),
        ]),
      ]),
      node('section', { name: 'Section 2' }, [
        node('group', { name: 'Group 3' }, []),
        node('group', { name: 'Group 4' }, [
          node('page', { name: 'Page 3', href: '/build/classic' }),
          node('page', { name: 'Page 4', href: '/build/eas-json' }),
        ]),
      ]),
    ];
    expect(findActiveRoute(list, '/build/eas-json')).toMatchObject({
      page: findNode(list, { type: 'page', name: 'Page 4' }),
      group: findNode(list, { type: 'group', name: 'Group 4' }),
      section: findNode(list, { type: 'section', name: 'Section 2' }),
    });
  });

  it('skips hidden navigation node', () => {
    const list = [
      node('group', { name: 'Group 1' }, []),
      node('group', { name: 'Group 2', hidden: true }, [
        node('page', { name: 'Page 1', href: '/build' }),
        node('page', { name: 'Page 2', href: '/build/setup' }),
        node('page', { name: 'Page 3', href: '/build/eas-json' }),
      ]),
    ];
    expect(findActiveRoute(list, '/build/eas-json')).toMatchObject({
      page: null,
      group: null,
      section: null,
    });
  });
});

/** Helper function to find the first node that matches the predicate */
function findNode(
  list: NavigationNode[],
  predicate: Partial<NavigationNode> | ((node: NavigationNode) => boolean)
): NavigationNode | null {
  let result = null;
  visit(node('root', list), predicate as any, node => {
    result = node;
  });
  return result;
}
