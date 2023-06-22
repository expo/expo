import { css } from '@emotion/react';
import { Button, mergeClasses } from '@expo/styleguide';
import { breakpoints, spacing } from '@expo/styleguide-base';
import { ArrowCircleUpIcon, LayoutAlt03Icon } from '@expo/styleguide-icons';
import * as React from 'react';

import DocumentationSidebarRightLink from './DocumentationSidebarRightLink';

import { BASE_HEADING_LEVEL, Heading, HeadingManager } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { CALLOUT } from '~/ui/components/Text';

const sidebarStyle = css({
  padding: spacing[6],
  paddingTop: spacing[14],
  paddingBottom: spacing[12],
  width: 280,

  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    width: '100%',
  },
});

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 3 / 4;

const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 10;

const isDynamicScrollAvailable = () => {
  if (!history?.replaceState) {
    return false;
  }

  if (window.matchMedia('(prefers-reduced-motion)').matches) {
    return false;
  }

  return true;
};

type Props = React.PropsWithChildren<{
  maxNestingDepth?: number;
  selfRef?: React.RefObject<any>;
  contentRef?: React.RefObject<any>;
}>;

type PropsWithHM = Props & { headingManager: HeadingManager };

type State = {
  activeSlug: string | null;
  showScrollTop: boolean;
};

class DocumentationSidebarRight extends React.Component<PropsWithHM, State> {
  static defaultProps = {
    maxNestingDepth: 4,
  };

  state = {
    activeSlug: null,
    showScrollTop: false,
  };

  private slugScrollingTo: string | null = null;
  private activeItemRef = React.createRef<HTMLAnchorElement>();

  public handleContentScroll(contentScrollPosition: number) {
    const { headings } = this.props.headingManager;

    for (const { ref, slug } of headings) {
      if (!ref || !ref.current) {
        continue;
      }
      this.setState({ showScrollTop: contentScrollPosition > 120 });
      if (
        ref.current.offsetTop >=
          contentScrollPosition + window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR &&
        ref.current.offsetTop <= contentScrollPosition + window.innerHeight / 2
      ) {
        if (slug !== this.state.activeSlug) {
          // we can enable scrolling again
          if (slug === this.slugScrollingTo) {
            this.slugScrollingTo = null;
          }
          this.setState({ activeSlug: slug }, this.updateSelfScroll);
        }
        return;
      }
    }
  }

  render() {
    const { headings } = this.props.headingManager;

    //filter out headings nested too much
    const displayedHeadings = headings.filter(
      head =>
        head.level <= BASE_HEADING_LEVEL + this.props.maxNestingDepth! &&
        head.title.toLowerCase() !== 'see also'
    );

    return (
      <nav css={sidebarStyle} data-sidebar>
        <CALLOUT
          weight="medium"
          className="absolute -mt-14 bg-default w-[248px] flex min-h-[32px] pt-4 pb-2 gap-2 mb-2 items-center select-none">
          <LayoutAlt03Icon className="icon-sm" /> On this page
          <Button
            theme="quaternary"
            size="xs"
            className={mergeClasses(
              'ml-auto mr-2 px-2 transition-opacity opacity-1',
              !this.state.showScrollTop && 'opacity-0 pointer-events-none'
            )}
            onClick={e => this.handleTopClick(e)}>
            <ArrowCircleUpIcon className="icon-sm text-icon-secondary" />
          </Button>
        </CALLOUT>
        {displayedHeadings.map(heading => {
          const isActive = heading.slug === this.state.activeSlug;
          return (
            <DocumentationSidebarRightLink
              key={heading.slug}
              heading={heading}
              onClick={e => this.handleLinkClick(e, heading)}
              isActive={isActive}
              ref={isActive ? this.activeItemRef : undefined}
              shortenCode
            />
          );
        })}
      </nav>
    );
  }

  /**
   * Scrolls sidebar to keep active element always visible
   */
  private updateSelfScroll = () => {
    const selfScroll = this.props.selfRef?.current?.getScrollRef().current;
    const activeItemPos = this.activeItemRef.current?.offsetTop;

    if (!selfScroll || !activeItemPos || this.slugScrollingTo) {
      return;
    }

    const { scrollTop } = selfScroll;
    const upperThreshold = window.innerHeight * UPPER_SCROLL_LIMIT_FACTOR;
    const lowerThreshold = window.innerHeight * LOWER_SCROLL_LIMIT_FACTOR;

    if (activeItemPos < scrollTop + upperThreshold) {
      selfScroll.scrollTo({ behavior: 'auto', top: Math.max(0, activeItemPos - upperThreshold) });
    } else if (activeItemPos > scrollTop + lowerThreshold) {
      selfScroll.scrollTo({ behavior: 'auto', top: activeItemPos - lowerThreshold });
    }
  };

  private handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, heading: Heading) => {
    if (!isDynamicScrollAvailable()) {
      return;
    }

    event.preventDefault();
    const { slug, ref } = heading;

    // disable sidebar scrolling until we reach that slug
    this.slugScrollingTo = slug;

    this.props.contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: 'smooth',
      top: ref.current?.offsetTop - window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR,
    });
    history.replaceState(history.state, '', '#' + slug);
  };

  private handleTopClick = (
    event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (!isDynamicScrollAvailable()) {
      return;
    }

    event.preventDefault();

    this.props.contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: 'smooth',
      top: 0,
    });
    history.replaceState(history.state, '', ' ');
  };
}

type ReactRefProps = { reactRef: React.Ref<DocumentationSidebarRight> };

const SidebarWithHeadingManager = withHeadingManager(function SidebarWithHeadingManager({
  reactRef,
  ...props
}: Props & HeadingManagerProps & ReactRefProps) {
  return <DocumentationSidebarRight {...props} ref={reactRef} />;
}) as React.FC<Props & ReactRefProps>;

SidebarWithHeadingManager.displayName = 'SidebarRightRefWrapper';

const SidebarForwardRef = React.forwardRef<DocumentationSidebarRight, Props>((props, ref) => (
  <SidebarWithHeadingManager {...props} reactRef={ref} />
));

export type SidebarRightComponentType = DocumentationSidebarRight;

export default SidebarForwardRef;
