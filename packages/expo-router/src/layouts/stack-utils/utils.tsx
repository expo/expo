import { isValidElement, type ReactElement } from 'react';

export function isChildOfType<PropsT>(
  element: React.ReactNode,
  type: (props: PropsT) => unknown
): element is ReactElement<PropsT> {
  return isValidElement(element) && element.type === type;
}
