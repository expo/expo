import React from 'react';

type IconProps = {
  size?: number | string;
  title?: string;
  color?: string;
  /**
   * A suffix added to the end of the unique generated ID for the icon. This is useful if you have multiple of the same icon on the page and need to pass accessibility guidelines.
   */
  titleId?: string;
} & React.SVGProps<SVGSVGElement>;

export function QuestionIcon(props: IconProps) {
  const { title = 'Question-icon', size, color, width, height, titleId } = props;

  return (
    <svg
      width={size || width || '20px'}
      height={size || height || '20px'}
      viewBox="0 0 20 20"
      fill="none"
      role="img"
      aria-labelledby={titleId}
      {...props}>
      {title ? <title id={titleId}>{title}</title> : null}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 10a9 9 0 1118 0 9 9 0 01-18 0zm8.106 3.606a1.09 1.09 0 00-.314.793c0 .31.105.575.314.793.21.215.518.322.923.322.397 0 .695-.11.896-.329.2-.218.3-.48.3-.786 0-.31-.1-.571-.3-.786-.2-.218-.5-.328-.896-.328-.405 0-.713.107-.923.321zm.52-7.417a3.34 3.34 0 01.731-.075c.447 0 .789.094 1.026.28a.863.863 0 01.362.711c0 .224-.036.433-.11.63a1.806 1.806 0 01-.327.54c-.146.163-.278.3-.397.41a7.358 7.358 0 01-.471.39 18.68 18.68 0 00-.397.307 35.448 35.448 0 00-.499.424 9.725 9.725 0 01-.171.164 1.004 1.004 0 00-.15.164c-.019.036-.05.09-.096.164a.485.485 0 00-.082.198l-.034.219a2.28 2.28 0 00-.014.273c0 .32.048.593.144.82.095.224.214.335.355.335l.219.007c.146.005.264.007.355.007.265 0 .397-.139.397-.417 0-.055-.003-.148-.007-.28a10.48 10.48 0 01-.007-.342.86.86 0 01.15-.485 1.75 1.75 0 01.404-.417 7.92 7.92 0 01.54-.383c.2-.132.399-.278.595-.438.2-.159.382-.334.546-.526.164-.191.297-.428.397-.71.105-.288.157-.602.157-.944 0-.697-.262-1.24-.786-1.627-.52-.392-1.208-.588-2.064-.588-.994 0-1.725.17-2.195.513-.465.341-.697.777-.697 1.305 0 .278.089.531.267.76.182.227.458.34.827.34.187 0 .303-.024.348-.074.046-.055.069-.19.069-.404V6.395l.143-.069a2.11 2.11 0 01.472-.137z"
        fill={color || 'var(--expo-theme-icon-default)'}
      />
    </svg>
  );
}
