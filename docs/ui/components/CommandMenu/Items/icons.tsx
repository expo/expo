import { ArrowUpRightIcon, ChevronRightIcon } from '@expo/styleguide-icons';
import { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const FootnoteArrowIcon = () => (
  <ChevronRightIcon className="icon-xs text-icon-secondary inline-block relative mx-1 top-0.5" />
);

export const ExternalLinkIcon = () => (
  <ArrowUpRightIcon className="icon-md text-icon-secondary self-center ml-auto flex-shrink-0" />
);

export const GuideIcon = ({ className }: HTMLAttributes<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    className={twMerge('icon-md text-icon-secondary', className)}>
    <path
      d="M2.66675 12.9999C2.66675 12.5579 2.84234 12.134 3.1549 11.8214C3.46746 11.5088 3.89139 11.3333 4.33341 11.3333H13.3334"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.33341 1.33325H13.3334V14.6666H4.33341C3.89139 14.6666 3.46746 14.491 3.1549 14.1784C2.84234 13.8659 2.66675 13.4419 2.66675 12.9999V2.99992C2.66675 2.55789 2.84234 2.13397 3.1549 1.82141C3.46746 1.50885 3.89139 1.33325 4.33341 1.33325V1.33325Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ReactIcon = ({ className }: HTMLAttributes<SVGSVGElement>) => (
  <svg
    viewBox="-11.5 -10.23174 23 20.46348"
    className={twMerge('icon-md text-icon-secondary', className)}>
    <circle cx="0" cy="0" r="2.05" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);
