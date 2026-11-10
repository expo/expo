---
'eslint-config-expo': patch
---

Legacy config: extend the React `recommended` preset. This adds `react/jsx-key`, `react/no-children-prop`, `react/no-unescaped-entities`, `react/no-find-dom-node`, `react/no-is-mounted`, `react/no-render-return-value` and `react/jsx-no-comment-textnodes` as errors, and raises the React rules the config already enabled from `warn` to `error`. `react/react-in-jsx-scope`, `react/prop-types` and `react/jsx-no-target-blank` stay off.
