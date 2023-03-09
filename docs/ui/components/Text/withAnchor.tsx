import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { spacing } from '@expo/styleguide-base';
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

import { durations } from '~/ui/foundations/durations';

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
      <Component css={headingStyle} data-id={slug} {...rest}>
        <span css={anchorStyle} id={slug} />
        <A href={`#${slug}`} css={linkStyle}>
          {children}
        </A>
      </Component>
    );
  }
  AnchorComponent.displayName = `Anchor(${Component.displayName})`;
  return AnchorComponent;
}

const headingStyle = css({
  position: 'relative',
});

const anchorStyle = css({
  position: 'relative',
  top: -100,
  visibility: 'hidden',
});

const linkStyle = css({
  position: 'relative',
  color: 'inherit',
  textDecoration: 'inherit',

  '::before': {
    content: '"#"',
    position: 'absolute',
    transform: 'translatex(-100%)',
    transition: `opacity ${durations.hover}`,
    opacity: 0,
    color: theme.icon.secondary,
    padding: `0.25em ${spacing[2]}px`,
    fontSize: '0.75em',
  },

  '&:hover': {
    '::before': {
      opacity: 1,
    },
  },
});

function useSlug(id: string | undefined, children: ReactNode) {
  const slugger = useContext(AnchorContext)!;
  let slugText = id;

  if (!slugText) {
    slugText = getTextFromChildren(children);
    maybeWarnMissingID(slugText);
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

/** Eventually, we want to get rid of the auto-generating ID. For now, we need to do this */
function maybeWarnMissingID(identifier: ReactNode) {
  // commenting this out, it's not useful to log this warning, only when actually fixing this issue.
  // console.warn(
  //   `Anchor element "${identifier}" is missing ID, please add it manually. Auto-generating anchor IDs will be deprecated.`
  // );
}
