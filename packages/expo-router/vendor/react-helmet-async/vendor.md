This library has been vendored to remove the dependency on `react-dom` and allow the peerDependency for `react@19.x` to be satisfied.

The `shallowequal` dependency is inlined because the dispatcher only needs its basic, comparator-free behavior.

The `invariant` calls use equivalent conditional `Error` throws to avoid retaining the dependency.

This is a fork of `react-helmet-async` https://github.com/staylor/react-helmet-async
