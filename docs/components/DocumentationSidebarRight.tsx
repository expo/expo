import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowCircleUpIcon } from '@expo/styleguide-icons/outline/ArrowCircleUpIcon';
import { LayoutAlt03Icon } from '@expo/styleguide-icons/outline/LayoutAlt03Icon';
import * as React from 'react';

import DocumentationSidebarRightLink from './DocumentationSidebarRightLink';

import { BASE_HEADING_LEVEL, Heading, HeadingManager } from '~/common/headingManager';
import withHeadingManager, {
  HeadingManagerProps,
} from '~/components/page-higher-order/withHeadingManager';
import { CALLOUT } from '~/ui/components/Text';

const UPPER_SCROLL_LIMIT_FACTOR = 1 / 4;
const LOWER_SCROLL_LIMIT_FACTOR = 3 / 4;

const ACTIVE_ITEM_OFFSET_FACTOR = 1 / 20;

const isDynamicScrollAvailable = () => {
  return !window.matchMedia('(prefers-reduced-motion)').matches;
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
      <nav className="w-[280px] px-6 pb-12 pt-14" data-sidebar>
        <CALLOUT
          weight="medium"
          className="absolute z-10 -mt-14 mb-2 flex min-h-[32px] w-[248px] select-none items-center gap-2 bg-default pb-2 pt-4">
          <LayoutAlt03Icon className="icon-sm" /> On this page
          <Button
            theme="quaternary"
            size="xs"
            className={mergeClasses(
              'ml-auto mr-2 px-2 transition-opacity duration-300',
              !this.state.showScrollTop && 'pointer-events-none opacity-0'
            )}
            onClick={e => this.handleTopClick(e)}>
            <ArrowCircleUpIcon className="icon-sm text-icon-secondary" aria-label="Scroll to top" />
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

  private handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    { slug, ref, type }: Heading
  ) => {
    event.preventDefault();

    // disable sidebar scrolling until we reach that slug
    this.slugScrollingTo = slug;

    const scrollOffset = type === 'inlineCode' ? 50 : 26;

    this.props.contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: isDynamicScrollAvailable() ? 'smooth' : 'instant',
      top: ref.current?.offsetTop - window.innerHeight * ACTIVE_ITEM_OFFSET_FACTOR - scrollOffset,
    });

    if (history?.replaceState) {
      history.replaceState(history.state, '', '#' + slug);
    }
  };

  private handleTopClick = (
    event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();

    this.props.contentRef?.current?.getScrollRef().current?.scrollTo({
      behavior: isDynamicScrollAvailable() ? 'smooth' : 'instant',
      top: 0,
    });

    if (history?.replaceState) {
      history.replaceState(history.state, '', ' ');
    }
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
