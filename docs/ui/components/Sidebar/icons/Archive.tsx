import { iconSize, theme } from '@expo/styleguide';
import { IconProps } from '@expo/styleguide/dist/types';

export const ArchiveIcon = ({ size = iconSize.sm }: IconProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 16 13" fill="none">
      <path
        d="M13.727 4.05554V12H2.27246V4.05554"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 1H1V4.05557H15V1Z"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.72705 6.5H7.99978H9.27251"
        stroke={theme.icon.default}
        strokeWidth="1.16667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
