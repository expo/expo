import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';

import { FieldSection } from './FieldSection';

/**
 * Mirrors SwiftUI `Form`'s behavior of treating direct non-`Section` children
 * as rows in an implicit section. Consecutive non-[`FieldGroup.Section`](#fieldgroupsection)
 * children are collected and wrapped in a synthetic section so they pick up
 * the same rounded-corner grouped styling as explicit sections.
 */
export function groupFieldGroupChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];
  let buffered: ReactNode[] = [];

  const flush = () => {
    if (buffered.length === 0) return;
    result.push(
      <FieldSection key={`__implicit-section-${result.length}__`}>{buffered}</FieldSection>
    );
    buffered = [];
  };

  Children.forEach(children, (child) => {
    if (isSectionElement(child)) {
      flush();
      result.push(child);
      return;
    }
    if (isValidElement(child) && child.type === Fragment) {
      // Recurse into fragments so users can group explicit sections + rows
      // without the fragment itself being treated as a row.
      const fragmentProps = child.props as { children?: ReactNode };
      const nested = groupFieldGroupChildren(fragmentProps.children);
      nested.forEach((nestedChild) => {
        if (isSectionElement(nestedChild)) {
          flush();
          result.push(nestedChild);
        } else {
          buffered.push(nestedChild);
        }
      });
      return;
    }
    buffered.push(child);
  });

  flush();
  return result;
}

function isSectionElement(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.type === FieldSection;
}
