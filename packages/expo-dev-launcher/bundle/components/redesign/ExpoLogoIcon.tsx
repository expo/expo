import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

export function ExpoLogoIcon(props: SvgProps) {
  return (
    <Svg
      width={20}
      height={17}
      fill="none"
      viewBox="0 0 20 17"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.67 14.429c.033.405.177.812.553 1.359.446.648 1.214 1.003 1.774.432.378-.385 4.466-7.468 6.436-10.152a.59.59 0 01.962 0c1.97 2.684 6.058 9.767 6.436 10.152.56.572 1.328.216 1.774-.432.44-.638.562-1.086.562-1.564 0-.325-6.367-12.069-7.008-13.046C11.543.238 11.354.033 10.312 0h-.796C8.474.033 8.286.237 7.67 1.178c-.628.957-6.746 12.237-7 13.011v.24z"
        fill="#1B1F23"
      />
    </Svg>
  );
}
