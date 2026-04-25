import { type ReactNode } from 'react';
/**
 * Mirrors SwiftUI `Form`'s behavior of treating direct non-`Section` children
 * as rows in an implicit section. Consecutive non-[`FieldGroup.Section`](#fieldgroupsection)
 * children are collected and wrapped in a synthetic section so they pick up
 * the same rounded-corner grouped styling as explicit sections.
 */
export declare function groupFieldGroupChildren(children: ReactNode): ReactNode[];
//# sourceMappingURL=groupChildren.d.ts.map