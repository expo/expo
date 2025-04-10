import { LinkBase, mergeClasses } from '@expo/styleguide';
import { TriangleDownIcon } from '@expo/styleguide-icons/custom/TriangleDownIcon';
import { ListIcon } from '@expo/styleguide-icons/outline/ListIcon';
import { useRouter } from 'next/compat/router';
import { type ComponentType, type PropsWithChildren, useRef, useEffect } from 'react';

import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink';

import { Requirement } from './Requirement';

type PrerequisitesProps = PropsWithChildren<{
  /**
   * The number of requirements for the prerequisites.
   */
  numberOfRequirements: number;
  /**
   * If the prerequisites should be rendered "open" by default.
   */
  open?: boolean;
  className?: string;
}>;

const Prerequisites: ComponentType<PrerequisitesProps> = withHeadingManager(
  ({
    numberOfRequirements = 1,
    children,
    className,
    headingManager,
    open = false,
  }: PrerequisitesProps & HeadingManagerProps) => {
    const router = useRouter();
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const anchorId = 'prerequisites';

    // Makes the prerequisite headings unique to make it possible to link to them.
    const heading = useRef(headingManager.addHeading(anchorId, 1, undefined));

    // Expands collapsible if the current hash matches the heading
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
        id={anchorId}
        className={mergeClasses(
          'mb-3 scroll-m-4 rounded-md border border-default p-0',
          '[&[open]]:shadow-xs',
          '[h4+&]:mt-3 [li>&]:mt-3 [p+&]:mt-3',
          className
        )}
        open={open}>
        <summary
          className={mergeClasses(
            'group m-0 flex cursor-pointer items-center justify-between rounded-md p-1.5 py-3 pr-4',
            '[details[open]>&]:rounded-b-none',
            'hocus:bg-subtle'
          )}>
          <div className="flex items-center">
            <div className="ml-1.5 mr-2 mt-[5px] self-baseline">
              <TriangleDownIcon
                className={mergeClasses(
                  'icon-sm text-icon-default',
                  '-rotate-90 transition-transform duration-200',
                  '[details[open]>summary_&]:rotate-0'
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <ListIcon className={mergeClasses('icon-sm text-icon-default')} />
              <p
                className={mergeClasses(
                  'relative inline scroll-m-5',
                  'group-hover:text-secondary group-hover:[&_code]:text-secondary'
                )}>
                Prerequisites
              </p>
            </div>
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
          </div>
          <div>
            <p className="text-xs text-secondary">
              {numberOfRequirements} requirement{numberOfRequirements === 1 ? '' : 's'}
            </p>
          </div>
        </summary>
        {children}
      </details>
    );
  }
);

export { Prerequisites, Requirement };
