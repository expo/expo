import { css } from '@emotion/react';
import { LinkBase, shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { TriangleDownIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';
import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';

import { PermalinkCopyIcon } from '~/components/Permalink';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { DEMI } from '~/ui/components/Text';

type CollapsibleProps = PropsWithChildren<{
  /**
   * The content of the collapsible summary.
   */
  summary: ReactNode;
  /**
   * If the collapsible should be rendered "open" by default.
   */
  open?: boolean;
  testID?: string;
}>;

const Collapsible: React.FC<CollapsibleProps> = withHeadingManager(
  (props: CollapsibleProps & HeadingManagerProps) => {
    const { summary, testID, children } = props;

    const router = useRouter();
    const { asPath } = router || {};

    // expand collapsible if the current hash matches the heading
    React.useEffect(() => {
      if (asPath) {
        const splitUrl = asPath.split('#');
        const hash = splitUrl.length ? splitUrl[1] : undefined;
        if (hash && hash === heading.current.slug) {
          setOpen(true);
        }
      }
    }, [asPath]);

    // track open state so we can collapse header if it is set to open by the URL hash
    const [open, setOpen] = React.useState<boolean>(props.open ?? false);

    const onToggle = (event: { preventDefault: () => void }) => {
      event.preventDefault();
      setOpen(!open);
    };

    // HeadingManager is used to generate a slug that corresponds to the collapsible summary.
    // These are normally generated for MD (#) headings, but Collapsible doesn't have those.
    // This is a ref because identical tags will keep incrementing the number if it is not.
    const heading = React.useRef(props.headingManager.addHeading(summary, 1, undefined));

    return (
      <details
        id={heading.current.slug}
        onClick={onToggle}
        css={detailsStyle}
        open={open}
        data-testid={testID}>
        <summary css={summaryStyle}>
          <div css={markerWrapperStyle}>
            <TriangleDownIcon className="icon-sm text-icon-default" css={markerStyle} />
          </div>
          <LinkBase href={'#' + heading.current.slug} ref={heading.current.ref}>
            <DEMI>{summary}</DEMI>
            <PermalinkCopyIcon slug={heading.current.slug} />
          </LinkBase>
        </summary>
        <div css={contentStyle}>{children}</div>
      </details>
    );
  }
);

export { Collapsible };

const detailsStyle = css({
  overflow: 'hidden',
  background: theme.background.default,
  border: `1px solid ${theme.border.default}`,
  borderRadius: borderRadius.md,
  padding: 0,
  marginBottom: spacing[3],

  '&[open]': {
    boxShadow: shadows.xs,
  },

  'h4:first-child': {
    marginTop: 0,
  },

  'h4 + &, p + &, li > &': {
    marginTop: spacing[3],
  },
});

const summaryStyle = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  userSelect: 'none',
  listStyle: 'none',
  backgroundColor: theme.background.subtle,
  padding: spacing[1.5],
  paddingRight: spacing[3],
  margin: 0,
  cursor: 'pointer',

  '&:hover span': {
    color: theme.text.secondary,
  },

  '::-webkit-details-marker': {
    display: 'none',
  },

  h4: {
    marginTop: 0,
    marginBottom: 0,
  },

  code: {
    backgroundColor: theme.background.element,
    display: 'inline',
    fontSize: '90%',
  },
});

const markerWrapperStyle = css({
  alignSelf: 'baseline',
  marginTop: 5,
  marginLeft: spacing[1.5],
  marginRight: spacing[2],
});

const markerStyle = css({
  transform: 'rotate(-90deg)',
  transition: `transform 200ms`,

  'details[open] &': { transform: 'rotate(0)' },
});

const contentStyle = css({
  padding: `${spacing[4]}px ${spacing[5]}px 0`,

  p: {
    marginLeft: 0,
  },

  'pre > pre': {
    marginTop: 0,
  },
});
