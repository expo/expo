import { LinkBase, mergeClasses } from '@expo/styleguide';
import { TriangleDownIcon } from '@expo/styleguide-icons/custom/TriangleDownIcon';
import { ListIcon } from '@expo/styleguide-icons/outline/ListIcon';
import { motion } from 'framer-motion';
import { useRouter } from 'next/compat/router';
import {
  Children,
  isValidElement,
  type ComponentType,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';

import withHeadingManager, { HeadingManagerProps } from '~/common/withHeadingManager';
import { PermalinkIcon } from '~/ui/components/Permalink';

import { Requirement } from './Requirement';

type PrerequisitesProps = PropsWithChildren<{
  /**
   * If the prerequisites should be rendered "open" by default.
   */
  open?: boolean;
  className?: string;
}>;

const Prerequisites: ComponentType<PrerequisitesProps> = withHeadingManager(
  ({
    children,
    className,
    headingManager,
    open = false,
  }: PrerequisitesProps & HeadingManagerProps) => {
    const requirementChildren = Children.toArray(children).filter(
      child => isValidElement(child) && child.type === Requirement
    );
    const numberOfRequirements = requirementChildren.length;
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(open);
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const anchorId = 'prerequisites';

    // Makes the prerequisite headings unique to make it possible to link to them.
    const heading = useRef(headingManager.addHeading(anchorId, 1, undefined));

    // Expands collapsible if the current hash matches the heading
    useEffect(() => {
      if (router?.asPath) {
        const splitUrl = router.asPath.split('#');
        const hash = splitUrl.length > 0 ? splitUrl[1] : undefined;
        if (hash && hash === heading.current.slug) {
          detailsRef.current?.setAttribute('open', '');
          setIsOpen(true);
        }
      }
    }, [router?.asPath]);

    useEffect(() => {
      if (open) {
        detailsRef.current?.setAttribute('open', '');
        setIsOpen(true);
      }
    }, [open]);
    return (
      <details
        id={heading.current.slug}
        className={mergeClasses(
          'border-default mb-3 scroll-m-4 rounded-md border p-0',
          '[[open]]:shadow-xs',
          '[h4+&]:mt-3 [li>&]:mt-3 [p+&]:mt-3',
          className
        )}
        ref={detailsRef}
        open={isOpen}
        onToggle={event => {
          setIsOpen(event.currentTarget.open);
        }}>
        <summary
          className={mergeClasses(
            'group m-0 flex cursor-pointer items-center justify-between rounded-md p-1.5 py-3 pr-4',
            '[details[open]>&]:rounded-b-none',
            'hocus:bg-subtle'
          )}>
          <div className="flex items-center">
            <div className="mt-1.25 mr-2 ml-1.5 self-baseline">
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
                setIsOpen(true);
              }}
              className="hocus:bg-element ml-1 inline rounded-md p-1"
              aria-label="Permalink">
              <PermalinkIcon className="icon-sm invisible inline-flex group-hover:visible group-focus-visible:visible" />
            </LinkBase>
          </div>
          <div>
            <p className="text-secondary text-sm">
              {numberOfRequirements} requirement{numberOfRequirements === 1 ? '' : 's'}
            </p>
          </div>
        </summary>
        <motion.div
          initial={false}
          animate={{
            transition: { type: 'tween' },
            height: isOpen ? 'auto' : 0,
          }}
          className="overflow-hidden">
          <div>
            {requirementChildren.map((child, index) => (
              <div
                key={index}
                className={mergeClasses('border-default flex items-baseline gap-1.5 border-t p-5')}>
                {numberOfRequirements > 1 && (
                  <p className="mb-2 text-right font-medium">{index + 1}.</p>
                )}
                {child}
              </div>
            ))}
          </div>
        </motion.div>
      </details>
    );
  }
);

export { Prerequisites, Requirement };
