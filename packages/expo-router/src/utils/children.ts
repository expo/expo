import {
  Children,
  isValidElement,
  type JSXElementConstructor,
  type ReactElement,
  type ReactNode,
} from 'react';

export function isChildOfType<ComponentT extends JSXElementConstructor<any>>(
  element: React.ReactNode,
  type: ComponentT
): element is ReactElement<React.ComponentProps<ComponentT>, ComponentT> {
  return isValidElement(element) && element.type === type;
}

export function getFirstChildOfType<ComponentT extends JSXElementConstructor<any>>(
  children: React.ReactNode | React.ReactNode[],
  type: ComponentT
) {
  return Children.toArray(children).find((child) => isChildOfType(child, type));
}

export function getAllChildrenOfType<ComponentT extends JSXElementConstructor<any>>(
  children: React.ReactNode | React.ReactNode[],
  type: ComponentT
) {
  return Children.toArray(children).filter((child) => isChildOfType(child, type));
}

export function getAllChildrenNotOfType<ComponentT extends JSXElementConstructor<any>>(
  children: React.ReactNode | React.ReactNode[],
  type: ComponentT
) {
  return Children.toArray(children).filter((child) => !isChildOfType(child, type));
}

export function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(
  children: ReactNode | ReactNode[],
  components: Components
): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[] {
  return Children.toArray(children).filter(
    (
      child
    ): child is React.ReactElement<React.ComponentProps<Components[number]>, Components[number]> =>
      isValidElement(child) && components.includes(child.type as (props: any) => ReactNode)
  );
}
