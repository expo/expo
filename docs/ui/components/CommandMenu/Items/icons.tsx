import { mergeClasses } from '@expo/styleguide';
import { ArrowUpRightIcon, ChevronRightIcon } from '@expo/styleguide-icons';
import { HTMLAttributes } from 'react';

export const FootnoteArrowIcon = () => (
  <ChevronRightIcon className="icon-xs text-icon-secondary inline-block relative mx-1 top-0.5" />
);

export const ExternalLinkIcon = () => (
  <ArrowUpRightIcon className="text-icon-secondary self-center ml-auto flex-shrink-0" />
);

export const ReactIcon = ({ className }: HTMLAttributes<SVGSVGElement>) => (
  <svg
    viewBox="-11.5 -10.23174 23 20.46348"
    className={mergeClasses('icon-md text-icon-secondary', className)}>
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);
