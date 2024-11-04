import { LinkBase, mergeClasses } from '@expo/styleguide';
import { TriangleDownIcon } from '@expo/styleguide-icons/custom/TriangleDownIcon';
import { useRouter } from 'next/compat/router';
import {
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
  useRef,
  useState,
  useEffect,
  MouseEventHandler,
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
  className?: string;
}>;

const Collapsible: ComponentType<CollapsibleProps> = withHeadingManager(
  ({
    summary,
    testID,
    children,
    className,
    headingManager,
    open = false,
  }: CollapsibleProps & HeadingManagerProps) => {
    // track open state so we can collapse header if it is set to open by the URL hash
    const [isOpen, setIsOpen] = useState<boolean>(open);
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
          setIsOpen(true);
        }
      }
    }, []);

    const onToggle: MouseEventHandler<HTMLElement> = event => {
      // Detect if we are clicking the PermalinkIcon. Probably a better way to do this?
      if (event.target instanceof SVGElement) {
        if (!isOpen) {
          setIsOpen(true);
        }
      } else {
        setIsOpen(!isOpen);
        // Ensure that the collapsible opens nicely on the first click
        event.preventDefault();
      }
    };

    return (
      <details
        id={heading.current.slug}
        className={mergeClasses(
          'bg-default border border-default rounded-md p-0 mb-3',
          '[&[open]]:shadow-xs',
          '[h4+&]:mt-3 [p+&]:mt-3 [li>&]:mt-3',
          className
        )}
        open={isOpen}
        data-testid={testID}>
        <summary
          className={mergeClasses(
            'group grid grid-cols-[min-content_auto_min-content_1fr] items-center select-none bg-subtle p-1.5 pr-3 m-0 rounded-md cursor-pointer',
            isOpen && 'rounded-b-none',
            '[&_h4]:my-0',
            '[&_code]:bg-element [&_code]:inline [&_code]:text-[85%] [&_code]:leading-snug [&_code]:pb-px [&_code]:mt-px'
          )}
          onClick={onToggle}>
          <div className="mt-[5px] ml-1.5 mr-2 self-baseline">
            <TriangleDownIcon
              className={mergeClasses(
                'icon-sm text-icon-default',
                'transition-transform duration-200 -rotate-90',
                '[details[open]>summary_&]:rotate-0'
              )}
            />
          </div>
          <DEMI
            className={mergeClasses(
              'inline gap-1.5 items-center scroll-m-5 mr-2 relative',
              'group-hover:text-secondary group-hover:[&_code]:text-secondary'
            )}>
            {summary}
          </DEMI>
          <LinkBase
            href={'#' + heading.current.slug}
            ref={heading.current.ref}
            className="inline ml-auto">
            <PermalinkIcon className="icon-sm inline-flex mb-auto invisible group-hover:visible group-focus-visible:visible" />
          </LinkBase>
          <div />
        </summary>
        <div className={mergeClasses('py-4 px-5', '[&_p]:ml-0 [&_pre>pre]:mt-0 last:[&>*]:!mb-1')}>
          {children}
        </div>
      </details>
    );
  }
);

export { Collapsible };
