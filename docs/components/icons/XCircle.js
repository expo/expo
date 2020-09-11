import * as Constants from '~/common/constants';

export const XCircle = ({ size = 24 }) => (
  <svg
    aria-label="x"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={Constants.expoColors.red[600]} />
    <path
      d="M16.5 7.5l-9 9M7.5 7.5l9 9"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
