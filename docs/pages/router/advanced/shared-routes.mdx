---
title: Shared routes
description: Learn how to define shared routes or use arrays to use the same route multiple times with different layouts using Expo Router.
hideTOC: true
---

import { FileTree } from '~/ui/components/FileTree';

To match the same URL with different layouts, use [**groups**](/router/layouts#groups) with overlapping child routes. This pattern is very common in native apps. For example, in the X app, a profile can be viewed in every tab (such as home, search, and profile). However, there is only one URL that is required to access this route.

In the example below, **app/\_layout.tsx** is the tab bar and each route has its own header. The **app/(profile)/[user].tsx** route is shared between each tab.

<FileTree
  files={[
    'app/_layout.tsx',
    'app/(home)/_layout.tsx',
    'app/(home)/[user].tsx',
    'app/(search)/_layout.tsx',
    'app/(search)/[user].tsx',
    'app/(profile)/_layout.tsx',
    'app/(profile)/[user].tsx',
  ]}
/>

> When reloading the page, the first alphabetical match is rendered.

Shared routes can be navigated directly by including the group name in the route. For example, `/(search)/baconbrix` navigates to `/baconbrix` in the "search" layout.

## Arrays

> Array syntax is an advanced concept that is unique to native app development.

Instead of defining the same route multiple times with different layouts, use the array syntax `(,)` to duplicate the children of a group. For example, `app/(home,search)/[user].tsx` &mdash; creates `app/(home)/[user].tsx` and `app/(search)/[user].tsx` in memory.

To distinguish between the two routes use a layout's `segment` prop:

```tsx app/(home,search)/_layout.tsx
export default function DynamicLayout({ segment }) {
  if (segment === '(search)') {
    return <SearchStack />;
  }

  return <Stack />;
}
```
