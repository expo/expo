import { mergeClasses } from '@expo/styleguide';
import { useId, type HTMLAttributes } from 'react';

export const ExpoServicesIcon = ({ className, ...rest }: HTMLAttributes<SVGSVGElement>) => {
  const id = useId();
  const verticalMaskId = `${id}-vertical`;
  const horizontalMaskId = `${id}-horizontal`;
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={mergeClasses('icon-sm text-icon-default', className)}
      {...rest}>
      <circle cx="7.99925" cy="8.00007" r="7.5" stroke="currentColor" />
      <mask id={verticalMaskId} fill="white">
        <path d="M12.9992 8.00007C12.9992 12.4183 10.7607 16.0001 7.99925 16.0001C5.23782 16.0001 2.99925 12.4183 2.99925 8.00007C2.99925 3.58179 5.23782 7.21216e-05 7.99925 7.21216e-05C10.7607 7.21216e-05 12.9992 3.58179 12.9992 8.00007Z" />
      </mask>
      <ellipse
        cx="7.99925"
        cy="8.00007"
        rx="5"
        ry="8"
        stroke="currentColor"
        strokeWidth="2"
        mask={`url(#${verticalMaskId})`}
      />
      <mask id={horizontalMaskId} fill="white">
        <path d="M7.99925 13.0001C3.58097 13.0001 -0.000753742 10.7615 -0.000753621 8.00007C-0.000753501 5.23865 3.58097 3.00007 7.99925 3.00007C12.4175 3.00007 15.9992 5.23865 15.9992 8.00007C15.9992 10.7615 12.4175 13.0001 7.99925 13.0001Z" />
      </mask>
      <ellipse
        cx="7.99925"
        cy="8.00007"
        rx="8"
        ry="5"
        stroke="currentColor"
        strokeWidth="2"
        mask={`url(#${horizontalMaskId})`}
      />
      <path
        d="M8.25033 5.31055H7.74827C7.5165 5.31055 7.30402 5.43443 7.19724 5.63184L5.0692 9.56562C5.01979 9.65695 5.01608 9.76483 5.0591 9.85909L5.2353 10.2451C5.34495 10.4854 5.69017 10.5096 5.83504 10.2872L7.85228 7.19038C7.88396 7.14174 7.93952 7.11219 7.9993 7.11219C8.05907 7.11219 8.11463 7.14174 8.14631 7.19038L10.1636 10.2872C10.3084 10.5096 10.6536 10.4854 10.7633 10.2451L10.9395 9.85909C10.9825 9.76483 10.9788 9.65695 10.9294 9.56562L8.80136 5.63184C8.69457 5.43443 8.4821 5.31055 8.25033 5.31055Z"
        fill="currentColor"
      />
    </svg>
  );
};
