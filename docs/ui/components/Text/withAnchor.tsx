import GithubSlugger from 'github-slugger';
import {
  Children,
  FC,
  createContext,
  isValidElement,
  ReactNode,
  useContext,
  PropsWithChildren,
} from 'react';

import { A } from '.';
import { TextComponentProps } from './types';

export const AnchorContext = createContext<GithubSlugger | null>(null);

/**
 * Render the component with anchor elements and properties.
 * This adds the following elements:
 *   - hidden link position
 *   - children of the component
 *   - anchor hover icon
 */
export function withAnchor(Component: FC<PropsWithChildren<TextComponentProps>>) {
  function AnchorComponent({ id, children, ...rest }: TextComponentProps) {
    const slug = useSlug(id, children);
    return (
      <Component className="relative" data-id={slug} {...rest}>
        <span className="relative top-[-100px] invisible" id={slug} />
        <A href={`#${slug}`}>{children}</A>
      </Component>
    );
  }
  AnchorComponent.displayName = `Anchor(${Component.displayName})`;
  return AnchorComponent;
}

function useSlug(id: string | undefined, children: ReactNode) {
  const slugger = useContext(AnchorContext)!;
  let slugText = id;

  if (!slugText) {
    slugText = getTextFromChildren(children);
    /** Eventually, we want to get rid of the auto-generating ID */
  }

  return slugger.slug(slugText);
}

export function getTextFromChildren(children: ReactNode): string {
  return Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') {
        return child;
      }
      if (isValidElement(child)) {
        return getTextFromChildren(child.props.children);
      }
      return '';
    })
    .join(' ')
    .trim();
}
