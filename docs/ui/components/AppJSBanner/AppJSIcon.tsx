import { mergeClasses } from '@expo/styleguide';
import { type SVGProps } from 'react';

export function AppJSIcon({ className }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={mergeClasses('icon-md', className)}
      viewBox="0 0 200 204"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_2_135" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="204">
        <path d="M200 0H0V8.29057H200V0Z" fill="currentColor" />
        <path d="M200 16.291H0V24.5816H200V16.291Z" fill="currentColor" />
        <path d="M200 32.581H0V40.8716H200V32.581Z" fill="currentColor" />
        <path d="M200 48.872H0V57.1626H200V48.872Z" fill="currentColor" />
        <path d="M200 65.162H0V73.4526H200V65.162Z" fill="currentColor" />
        <path d="M200 81.453H0V89.7436H200V81.453Z" fill="currentColor" />
        <path d="M200 97.743H0V106.034H200V97.743Z" fill="currentColor" />
        <path d="M200 114.034H0V122.325H200V114.034Z" fill="currentColor" />
        <path d="M200 130.325H0V138.616H200V130.325Z" fill="currentColor" />
        <path d="M200 146.615H0V154.906H200V146.615Z" fill="currentColor" />
        <path d="M200 162.906H0V171.197H200V162.906Z" fill="currentColor" />
        <path d="M200 179.196H0V187.487H200V179.196Z" fill="currentColor" />
        <path d="M200 195.487H0V203.778H200V195.487Z" fill="currentColor" />
      </mask>
      <g mask="url(#mask0_2_135)">
        <path
          d="M100 200C155.228 200 200 155.228 200 100C200 44.7715 155.228 0 100 0C44.7715 0 0 44.7715 0 100C0 155.228 44.7715 200 100 200Z"
          fill="url(#paint0_linear_2_135)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear_2_135"
          x1="0"
          y1="0"
          x2="205.593"
          y2="200"
          gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
