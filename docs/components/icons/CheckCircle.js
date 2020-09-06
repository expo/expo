import * as Constants from '~/common/constants';

export const CheckCircle = ({ size = 24 }) => (
  <svg
    aria-label="check"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={Constants.expoColors.green[600]} />
    <path
      d="M18 7.5l-8.25 8.25L6 12"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
