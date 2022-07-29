import { iconSize } from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';

export const EASIcon = ({ size = iconSize.regular, className }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.25"
        y="0.25"
        width="19.5"
        height="19.5"
        rx="2.75"
        fill="#EDE9FF"
        stroke="#A193F9"
        strokeWidth="0.5"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6526 4.28159C10.3607 3.78244 9.63929 3.78244 9.34734 4.28159L3.10458 14.9549C2.80977 15.459 3.1733 16.0927 3.75723 16.0927H16.2428C16.8267 16.0927 17.1902 15.4589 16.8954 14.9549L10.6526 4.28159ZM14.5951 14.3915L13.7373 12.9251H6.26266L5.40493 14.3915H14.5951ZM12.1745 10.253L13.0077 11.6775H6.99234L7.82552 10.253H12.1745ZM11.4448 9.00546L10 6.53529L8.55521 9.00546H11.4448Z"
        fill="#2E2496"
      />
    </svg>
  );
};

export const EASInactiveIcon = ({ size = iconSize.regular, className }: IconProps) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="0.25"
        y="0.25"
        width="19.5"
        height="19.5"
        rx="2.75"
        fill="#F0F1F2"
        stroke="#9B9EA3"
        strokeWidth="0.5"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.6526 4.28159C10.3607 3.78244 9.63929 3.78244 9.34734 4.28159L3.10458 14.9549C2.80977 15.459 3.1733 16.0927 3.75723 16.0927H16.2428C16.8267 16.0927 17.1902 15.4589 16.8954 14.9549L10.6526 4.28159ZM14.5951 14.3915L13.7373 12.9251H6.26266L5.40493 14.3915H14.5951ZM12.1745 10.253L13.0077 11.6775H6.99234L7.82552 10.253H12.1745ZM11.4448 9.00546L10 6.53529L8.55521 9.00546H11.4448Z"
        fill="#595F68"
      />
    </svg>
  );
};
