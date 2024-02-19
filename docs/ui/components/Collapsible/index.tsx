import { css } from '@emotion/react';
import { LinkBase, shadows, theme } from '@expo/styleguide';
import { borderRadius, spacing } from '@expo/styleguide-base';
import { TriangleDownIcon } from '@expo/styleguide-icons';
import { useRouter } from 'next/compat/router';
import {
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
  useRef,
  useState,
  useEffect,
} from 'react';

import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink';
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

const Collapsible: ComponentType<CollapsibleProps> = withHeadingManager(
  ({
    summary,
    testID,
    children,
    headingManager,
    open = false,
  }: CollapsibleProps & HeadingManagerProps) => {
    // track open state so we can collapse header if it is set to open by the URL hash
    const [isOpen, setOpen] = useState<boolean>(open);
    const router = useRouter();

    // HeadingManager is used to generate a slug that corresponds to the collapsible summary.
    // These are normally generated for MD (#) headings, but Collapsible doesn't have those.
    // This is a ref because identical tags will keep incrementing the number if it is not.
    const heading = useRef(headingManager.addHeading(summary, 1, undefined));

    // expand collapsible if the current hash matches the heading
    useEffect(() => {
      if (router?.asPath) {
        const splitUrl = router.asPath.split('#');
        const hash = splitUrl.length ? splitUrl[1] : undefined;
        if (hash && hash === heading.current.slug) {
          setOpen(true);
        }
      }
    }, []);

    function onToggle() {
      setOpen(!isOpen);
    }

    return (
      <details id={heading.current.slug} css={detailsStyle} open={isOpen} data-testid={testID}>
        <summary css={summaryStyle} className="group">
          <div css={markerWrapperStyle} onClick={onToggle}>
            <TriangleDownIcon className="icon-sm text-icon-default" css={markerStyle} />
          </div>
          <LinkBase
            href={'#' + heading.current.slug}
            onClick={onToggle}
            ref={heading.current.ref}
            className="inline-flex gap-1.5 items-center scroll-m-5 relative">
            <DEMI>{summary}</DEMI>
            <PermalinkIcon className="icon-sm inline-flex invisible group-hover:visible group-focus-visible:visible" />
          </LinkBase>
        </summary>
        <div css={contentStyle} className="last:[&>*]:!mb-1">
          {children}
        </div>
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

  'h4 + &, p + &, li > &': {
    marginTop: spacing[3],
  },
});

const summaryStyle = css({
  display: 'grid',
  gridTemplateColumns: 'min-content auto 1fr',
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
  padding: `${spacing[4]}px ${spacing[5]}px`,

  p: {
    marginLeft: 0,
  },

  'pre > pre': {
    marginTop: 0,
  },
});
