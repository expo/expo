import { mergeClasses } from '@expo/styleguide';
import type { HTMLAttributes } from 'react';

export const ReferencesIcon = ({ className, ...rest }: HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={mergeClasses('icon-sm text-icon-default', className)}
      {...rest}>
      <rect x="0.5" y="0.5" width="15" height="15" rx="3.99999" stroke="currentColor" />
      <path
        d="M8.42261 3H7.57739C7.18721 3 6.82951 3.21735 6.64973 3.56367L3.06718 10.465C2.984 10.6253 2.97775 10.8145 3.05018 10.9799L3.34681 11.6572C3.5314 12.0787 4.11258 12.1211 4.35646 11.731L7.75249 6.29796C7.80584 6.21262 7.89937 6.16078 8 6.16078C8.10063 6.16078 8.19416 6.21262 8.2475 6.29796L11.6435 11.731C11.8874 12.1211 12.4686 12.0787 12.6532 11.6572L12.9498 10.9799C13.0222 10.8145 13.016 10.6253 12.9328 10.465L9.35027 3.56367C9.17049 3.21735 8.81279 3 8.42261 3Z"
        fill="currentColor"
      />
    </svg>
  );
};
