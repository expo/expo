import { LinkBase, mergeClasses } from '@expo/styleguide';
import { TriangleDownIcon } from '@expo/styleguide-icons/custom/TriangleDownIcon';
import { useRouter } from 'next/compat/router';
import {
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
  useRef,
  useEffect,
} from 'react';

import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
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
    const router = useRouter();
    const detailsRef = useRef<HTMLDetailsElement>(null);

    // HeadingManager is used to generate a slug that corresponds to the collapsible summary.
    // These are normally generated for MD (#) headings, but Collapsible doesn't have those.
    // This is a ref because identical tags will keep incrementing the number if it is not.
    const heading = useRef(headingManager.addHeading(summary, 1, undefined));

    // note(simek) expand collapsible if the current hash matches the heading
    useEffect(() => {
      if (router?.asPath) {
        const splitUrl = router.asPath.split('#');
        const hash = splitUrl.length ? splitUrl[1] : undefined;
        if (hash && hash === heading.current.slug) {
          detailsRef?.current?.setAttribute('open', '');
        }
      }
    }, []);

    return (
      <details
        ref={detailsRef}
        id={heading.current.slug}
        className={mergeClasses(
          'mb-3 scroll-m-4 rounded-md border border-default bg-default p-0',
          '[&[open]]:shadow-xs',
          '[h4+&]:mt-3 [li>&]:mt-3 [p+&]:mt-3',
          className
        )}
        open={open}
        data-testid={testID}>
        <summary
          className={mergeClasses(
            'group m-0 grid cursor-pointer select-none grid-cols-[min-content_auto_min-content_1fr] items-center rounded-md bg-subtle p-1.5 pr-3',
            '[details[open]>&]:rounded-b-none',
            '[&_h4]:my-0',
            '[&_code]:mt-px [&_code]:inline [&_code]:bg-element [&_code]:pb-px [&_code]:text-[85%] [&_code]:leading-snug'
          )}>
          <div className="ml-1.5 mr-2 mt-[5px] self-baseline">
            <TriangleDownIcon
              className={mergeClasses(
                'icon-sm text-icon-default',
                '-rotate-90 transition-transform duration-200',
                '[details[open]>summary_&]:rotate-0'
              )}
            />
          </div>
          <DEMI
            className={mergeClasses(
              'relative mr-1 inline scroll-m-5 items-center gap-1.5',
              'group-hover:text-secondary group-hover:[&_code]:text-secondary'
            )}>
            {summary}
          </DEMI>
          <LinkBase
            href={'#' + heading.current.slug}
            ref={heading.current.ref}
            onClick={() => {
              detailsRef?.current?.setAttribute('open', '');
            }}
            className="ml-auto inline rounded-md p-1 hocus:bg-element"
            aria-label="Permalink">
            <PermalinkIcon className="icon-sm invisible inline-flex group-hover:visible group-focus-visible:visible" />
          </LinkBase>
          <div />
        </summary>
        <div className={mergeClasses('px-5 py-4', 'last:[&>*]:!mb-1 [&_p]:ml-0 [&_pre>pre]:mt-0')}>
          {children}
        </div>
      </details>
    );
  }
);

export { Collapsible };
