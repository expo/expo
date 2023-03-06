import { HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export const GuidesIcon = ({ className, ...rest }: HTMLAttributes<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={twMerge('icon-md text-icon-default', className)}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}>
      <circle cx="8" cy="8" r="7.40001" stroke="currentColor" strokeWidth="1.4" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.871 10.4993L4.46717 11.8852C4.23578 11.958 4.01813 11.7404 4.09095 11.509L5.47688 7.1052L5.93972 5.86093C5.97068 5.7777 6.03692 5.71246 6.12062 5.68278L7.32725 5.25483L11.5621 4.04307C11.7885 3.9783 11.9978 4.18764 11.9331 4.41402L10.7214 8.64895L10.3284 9.83623C10.2998 9.92257 10.2336 9.99129 10.1484 10.0231L8.871 10.4993ZM8.00564 8.98235C8.54816 8.98235 8.98797 8.54255 8.98797 8.00003C8.98797 7.4575 8.54816 7.0177 8.00564 7.0177C7.46312 7.0177 7.02331 7.4575 7.02331 8.00003C7.02331 8.54255 7.46312 8.98235 8.00564 8.98235Z"
        fill="currentColor"
      />
    </svg>
  );
};
