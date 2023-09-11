import { mergeClasses } from '@expo/styleguide';
import { HTMLAttributes } from 'react';

export const ArchiveIcon = ({ className, ...rest }: HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 16 13"
      fill="none"
      className={mergeClasses('icon-md text-icon-default', className)}
      {...rest}>
      <path
        d="M13.727 4.05554V12H2.27246V4.05554"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 1H1V4.05557H15V1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.72705 6.5H7.99978H9.27251"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
