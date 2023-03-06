import { palette } from '@expo/styleguide-base';
import type { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const DocumentationIcon = ({ className, ...rest }: HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={twMerge('icon-md', className)}
      {...rest}>
      <path
        d="M14.477 12.0001H7.17725V2.91919H14.477C14.8606 2.91919 15.1716 3.23015 15.1716 3.61374V11.3055C15.1716 11.6891 14.8606 12.0001 14.477 12.0001Z"
        fill={palette.light.blue11}
      />
      <path
        d="M1.1432 12.0001H7.60645V2.91919H1.1432C0.759611 2.91919 0.448652 3.23015 0.448652 3.61374V11.3055C0.448652 11.6891 0.759611 12.0001 1.1432 12.0001Z"
        fill={palette.light.blue11}
      />
      <path
        d="M7.44238 2.75447V11.2081C6.25791 10.0362 1.9577 10.2382 1.9577 10.2382V0.893055C1.9577 0.893055 5.71355 0.264309 7.44238 2.75447Z"
        fill={palette.light.blue7}
      />
      <path
        d="M8.19653 2.75447V11.2081C9.38101 10.0362 13.6812 10.2382 13.6812 10.2382V0.893055C13.6812 0.893055 9.92537 0.264309 8.19653 2.75447Z"
        fill={palette.light.blue7}
      />
    </svg>
  );
};
