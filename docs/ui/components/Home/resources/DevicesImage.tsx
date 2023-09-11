import { css } from '@emotion/react';
import { breakpoints, darkTheme, palette } from '@expo/styleguide-base';

export const DevicesImage = () => (
  <svg
    css={css(`
      position: absolute;
      right: 0;
      bottom: 0;
      max-width: 60%;
      z-index: 1;

      @media screen and (max-width: ${breakpoints.medium}px) {
        bottom: -16px;
      }

      @media screen and (max-width: ${breakpoints.small}px) {
        bottom: -32px;
      }
    `)}
    width="354"
    height="164"
    viewBox="0 0 354 164"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_39:1396)">
      <rect
        x="214.901"
        y="22.3787"
        width="158"
        height="188"
        rx="4"
        transform="rotate(13 214.901 22.3787)"
        fill={darkTheme.background.element}
      />
      <rect
        x="211.247"
        y="38.208"
        width="195"
        height="171.754"
        transform="rotate(13 211.247 38.208)"
        fill="#745BFF"
      />
      <rect
        x="211.247"
        y="38.208"
        width="195"
        height="171.754"
        transform="rotate(13 211.247 38.208)"
        fill="url(#efeb358a5390d90e5e3ede15cf021e74)"
      />
      <rect
        x="251.549"
        y="60.3827"
        width="65.4637"
        height="41.3883"
        rx="3.31849"
        transform="rotate(13 251.549 60.3827)"
        fill="white"
      />
      <rect
        x="235.735"
        y="129.05"
        width="65.4637"
        height="19.1339"
        rx="3.31849"
        transform="rotate(13 235.735 129.05)"
        fill="white"
      />
      <rect
        opacity="0.8"
        x="241.129"
        y="105.664"
        width="65.4637"
        height="6.92818"
        rx="3.31849"
        transform="rotate(13 241.129 105.664)"
        fill="white"
      />
      <rect
        opacity="0.8"
        x="245.75"
        y="115.968"
        width="51.8308"
        height="6.92818"
        rx="3.31849"
        transform="rotate(13 245.75 115.968)"
        fill="white"
      />
      <mask
        id="50910997103ad906285f4061e1c96c9f"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="242"
        y="61"
        width="73"
        height="54">
        <rect
          id="a3822b3aca26c564aca3145ef4b4cf19"
          x="251.203"
          y="60.7385"
          width="65.7215"
          height="40.9636"
          rx="3.31849"
          transform="rotate(13 251.203 60.7385)"
          fill="white"
        />
      </mask>
      <g mask="url(#50910997103ad906285f4061e1c96c9f)">
        <path
          id="cbaa9d8985081c60ff5a0f147092262f"
          d="M279.283 82.7974L250.612 102.681L310.276 116.455L315.191 95.1648L309.285 82.5886L288.311 99.6618L279.283 82.7974Z"
          fill={palette.light.blue11}
        />
        <path
          id="6c507023d7a3817ecba32a2b54239a92"
          d="M266.579 86.2656L245.155 101.381L289.59 111.639L302.673 114.66L288.942 86.0274L273.263 98.9966L266.579 86.2656Z"
          fill={palette.light.blue10}
        />
      </g>
      <circle
        cx="260.869"
        cy="75.1075"
        r="7.01414"
        transform="rotate(13 260.869 75.1075)"
        fill="#FFE1A7"
      />
      <g clipPath="url(#clip1_39:1396)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M274.076 142.332C274.135 142.075 273.975 141.819 273.718 141.76C273.461 141.701 273.205 141.861 273.145 142.118L272.859 143.358L271.619 143.071C271.362 143.012 271.106 143.172 271.047 143.429C270.987 143.686 271.147 143.942 271.404 144.001L272.644 144.288L272.358 145.528C272.299 145.785 272.459 146.041 272.716 146.1C272.973 146.16 273.229 145.999 273.288 145.743L273.575 144.502L274.815 144.789C275.071 144.848 275.328 144.688 275.387 144.431C275.446 144.174 275.286 143.918 275.029 143.859L273.789 143.572L274.076 142.332Z"
          fill="#596068"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M265.393 142.89L264.918 143.647L263.868 143.404C263.184 143.246 262.5 143.673 262.342 144.358L261.197 149.319C261.039 150.004 261.466 150.687 262.151 150.845L268.971 152.42C269.656 152.578 270.34 152.151 270.498 151.466L271.643 146.506C271.801 145.821 271.374 145.137 270.689 144.979L269.64 144.737L269.545 143.848C269.516 143.579 269.32 143.357 269.055 143.296L266.075 142.608C265.811 142.547 265.537 142.66 265.393 142.89ZM266.062 149.462C267.09 149.7 268.115 149.059 268.352 148.032C268.589 147.004 267.949 145.979 266.921 145.742C265.894 145.505 264.869 146.145 264.632 147.173C264.394 148.2 265.035 149.225 266.062 149.462Z"
          fill="#596068"
        />
      </g>
      <circle
        cx="221.518"
        cy="32.0497"
        r="2.62"
        transform="rotate(13 221.518 32.0497)"
        fill="#7C848D"
      />
      <circle
        cx="229.543"
        cy="33.9022"
        r="2.62"
        transform="rotate(13 229.543 33.9022)"
        fill="#7C848D"
      />
      <circle
        cx="237.567"
        cy="35.7549"
        r="2.62"
        transform="rotate(13 237.567 35.7549)"
        fill="#7C848D"
      />
    </g>
    <rect
      x="13.8011"
      y="45.1538"
      width="88.9538"
      height="186.813"
      rx="9.95547"
      transform="rotate(-13 13.8011 45.1538)"
      fill="url(#798da3dad1527946ee33aecf8f9ec234)"
    />
    <rect
      x="18.0653"
      y="47.8184"
      width="81.8428"
      height="179.702"
      rx="6.39994"
      transform="rotate(-13 18.0653 47.8184)"
      stroke={darkTheme.background.element}
      strokeWidth="7.11105"
    />
    <rect
      x="27.9378"
      y="53.9677"
      width="65.4637"
      height="41.3883"
      rx="3.31849"
      transform="rotate(-13 27.9378 53.9677)"
      fill="white"
    />
    <rect
      x="43.8268"
      y="122.618"
      width="65.4637"
      height="19.1339"
      rx="3.31849"
      transform="rotate(-13 43.8268 122.618)"
      fill="white"
    />
    <rect
      opacity="0.8"
      x="38.4219"
      y="99.2343"
      width="65.4637"
      height="6.92818"
      rx="3.31849"
      transform="rotate(-13 38.4219 99.2343)"
      fill="white"
    />
    <rect
      opacity="0.8"
      x="47.0919"
      y="106.469"
      width="51.8308"
      height="6.92818"
      rx="3.31849"
      transform="rotate(-13 47.0919 106.469)"
      fill="white"
    />
    <mask
      id="c91e2833bce82b5f6ccc942f780f85d1"
      style={{ maskType: 'alpha' }}
      maskUnits="userSpaceOnUse"
      x="28"
      y="40"
      width="73"
      height="54">
      <rect
        x="27.7824"
        y="54.4393"
        width="65.7216"
        height="40.9636"
        rx="3.31849"
        transform="rotate(-13 27.7824 54.4393)"
        fill="white"
      />
    </mask>
    <g mask="url(#c91e2833bce82b5f6ccc942f780f85d1)">
      <path
        d="M62.6906 61.9562L45.6377 92.3956L105.302 78.6211L100.386 57.3308L89.5646 48.6166L78.1975 73.1563L62.6906 61.9562Z"
        fill={palette.light.blue11}
      />
      <path
        d="M52.7926 70.6425L40.1633 93.6194L84.598 83.3609L97.6809 80.3404L72.7879 60.6251L64.3809 79.1551L52.7926 70.6425Z"
        fill={palette.light.blue10}
      />
    </g>
    <circle
      cx="42.7692"
      cy="63.1166"
      r="7.01414"
      transform="rotate(-13 42.7692 63.1166)"
      fill="#FFE1A7"
    />
    <g clipPath="url(#clip2_39:1396)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M84.1094 117.748C84.0501 117.491 83.7938 117.331 83.537 117.391C83.2802 117.45 83.12 117.706 83.1793 117.963L83.4656 119.203L82.2258 119.489C81.969 119.549 81.8088 119.805 81.8681 120.062C81.9274 120.319 82.1837 120.479 82.4405 120.419L83.6804 120.133L83.9667 121.373C84.026 121.63 84.2822 121.79 84.5391 121.731C84.7959 121.672 84.9561 121.415 84.8968 121.159L84.6105 119.918L85.8509 119.632C86.1078 119.573 86.2679 119.317 86.2086 119.06C86.1493 118.803 85.893 118.643 85.6362 118.702L84.3957 118.988L84.1094 117.748Z"
        fill="#596068"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M76.5483 122.056L76.4534 122.945L75.4045 123.187C74.7196 123.345 74.2926 124.028 74.4507 124.713L75.5959 129.674C75.7541 130.359 76.4375 130.786 77.1224 130.628L83.9431 129.053C84.628 128.895 85.0551 128.211 84.897 127.527L83.7517 122.566C83.5936 121.881 82.9102 121.454 82.2253 121.612L81.1756 121.854L80.7007 121.097C80.5566 120.867 80.2827 120.754 80.0184 120.815L77.0379 121.503C76.7737 121.564 76.5771 121.786 76.5483 122.056ZM80.0313 127.67C81.0587 127.433 81.6993 126.408 81.4621 125.38C81.2249 124.353 80.1998 123.712 79.1724 123.95C78.1451 124.187 77.5045 125.212 77.7417 126.239C77.9789 127.267 79.004 127.907 80.0313 127.67Z"
        fill="#596068"
      />
    </g>
    <rect
      x="113.731"
      y="13.4504"
      width="88.9538"
      height="186.813"
      rx="9.95547"
      fill="url(#e2839d57a5b978f1058be04fb2a500dd)"
    />
    <rect
      x="117.287"
      y="17.006"
      width="81.8428"
      height="179.702"
      rx="6.39994"
      stroke={darkTheme.background.element}
      strokeWidth="7.11105"
    />
    <rect x="125.523" y="33.6431" width="65.4637" height="41.3883" rx="3.31849" fill="white" />
    <rect x="125.562" y="104.108" width="65.4637" height="19.1339" rx="3.31849" fill="white" />
    <rect
      opacity="0.8"
      x="125.556"
      y="80.1079"
      width="65.4637"
      height="6.92818"
      rx="3.31849"
      fill="white"
    />
    <rect
      opacity="0.8"
      x="132.376"
      y="89.1079"
      width="51.8308"
      height="6.92818"
      rx="3.31849"
      fill="white"
    />
    <mask
      id="cac8353d923d12b52a34815740143c7d"
      style={{ maskType: 'alpha' }}
      maskUnits="userSpaceOnUse"
      x="125"
      y="34"
      width="66"
      height="42">
      <rect x="125.266" y="34.0677" width="65.7216" height="40.9636" rx="3.31849" fill="white" />
    </mask>
    <g mask="url(#cac8353d923d12b52a34815740143c7d)">
      <path
        d="M157.588 49.2446L134.125 75.0678H195.358V53.2174L186.774 42.2922L170.178 63.646L157.588 49.2446Z"
        fill={palette.light.blue11}
      />
      <path
        d="M145.99 55.4817L128.516 75.0287H174.119H187.546L167.726 50.219L155.366 66.3829L145.99 55.4817Z"
        fill={palette.light.blue10}
      />
    </g>
    <circle cx="137.916" cy="45.894" r="7.01414" fill="#FFE1A7" />
    <g clipPath="url(#clip3_39:1396)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M165.908 108.425C165.908 108.161 165.694 107.948 165.43 107.948C165.167 107.948 164.953 108.161 164.953 108.425V109.698H163.68C163.417 109.698 163.203 109.911 163.203 110.175C163.203 110.438 163.417 110.652 163.68 110.652H164.953V111.925C164.953 112.188 165.167 112.402 165.43 112.402C165.694 112.402 165.908 112.188 165.908 111.925V110.652H167.18C167.444 110.652 167.658 110.438 167.658 110.175C167.658 109.911 167.444 109.698 167.18 109.698H165.908V108.425Z"
        fill="#596068"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M157.572 110.921L157.279 111.766H156.202C155.5 111.766 154.93 112.336 154.93 113.039V118.13C154.93 118.833 155.5 119.402 156.202 119.402H163.203C163.906 119.402 164.475 118.833 164.475 118.13V113.039C164.475 112.336 163.906 111.766 163.203 111.766H162.126L161.833 110.921C161.745 110.665 161.503 110.493 161.232 110.493H158.173C157.902 110.493 157.66 110.665 157.572 110.921ZM159.703 117.175C160.757 117.175 161.612 116.32 161.612 115.266C161.612 114.212 160.757 113.357 159.703 113.357C158.648 113.357 157.793 114.212 157.793 115.266C157.793 116.32 158.648 117.175 159.703 117.175Z"
        fill="#596068"
      />
    </g>
    <path
      d="M134.302 13.9601C134.856 13.6266 135.491 13.4504 136.139 13.4504H180.206C180.899 13.4504 181.576 13.6521 182.156 14.0309L185.142 15.9811C187.227 17.343 186.263 20.5831 183.773 20.5831C182.389 20.5831 181.268 21.7046 181.268 23.088V24.1495C181.268 26.1191 179.671 27.7158 177.701 27.7158H138.716C136.746 27.7158 135.149 26.1191 135.149 24.1495V23.1602C135.149 21.7369 133.996 20.5831 132.572 20.5831C129.96 20.5831 129.005 17.1432 131.245 15.7973L134.302 13.9601Z"
      fill={darkTheme.background.element}
    />
  </svg>
);

export const DevicesImageMasks = () => (
  <svg width="0" height="0">
    <filter
      id="3fe977fb0acabded0c62aa0c9c945938"
      x="162.611"
      y="17.3787"
      width="216.241"
      height="238.724"
      filterUnits="userSpaceOnUse"
      colorInterpolationFilters="sRGB">
      <feFlood floodOpacity="0" result="BackgroundImageFix" />
      <feColorMatrix
        in="SourceAlpha"
        type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"
      />
      <feOffset dy="5" />
      <feGaussianBlur stdDeviation="5" />
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_39:1396" />
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_39:1396" result="shape" />
    </filter>
    <linearGradient
      id="efeb358a5390d90e5e3ede15cf021e74"
      x1="229.398"
      y1="45.9863"
      x2="261.629"
      y2="225.302"
      gradientUnits="userSpaceOnUse">
      <stop stopColor={palette.light.blue9} />
      <stop offset="1" stopColor={palette.light.blue10} />
    </linearGradient>
    <linearGradient
      id="798da3dad1527946ee33aecf8f9ec234"
      x1="22.0813"
      y1="53.6141"
      x2="94.9801"
      y2="223.711"
      gradientUnits="userSpaceOnUse">
      <stop stopColor={palette.light.blue9} />
      <stop offset="1" stopColor={palette.light.blue10} />
    </linearGradient>
    <linearGradient
      id="e2839d57a5b978f1058be04fb2a500dd"
      x1="122.012"
      y1="21.9108"
      x2="194.91"
      y2="192.008"
      gradientUnits="userSpaceOnUse">
      <stop stopColor={palette.light.blue9} />
      <stop offset="1" stopColor={palette.light.blue10} />
    </linearGradient>
    <clipPath id="clip0_39:1396">
      <rect
        x="214.901"
        y="22.3787"
        width="158"
        height="188"
        rx="4"
        transform="rotate(13 214.901 22.3787)"
        fill="white"
      />
    </clipPath>
    <clipPath id="clip1_39:1396">
      <rect
        width="12.7276"
        height="12.7276"
        fill="white"
        transform="translate(263.63 138.778) rotate(13)"
      />
    </clipPath>
    <clipPath id="clip2_39:1396">
      <rect
        width="12.7276"
        height="12.7276"
        fill="white"
        transform="translate(73.1624 119.133) rotate(-13)"
      />
    </clipPath>
    <clipPath id="clip3_39:1396">
      <rect width="12.7276" height="12.7276" fill="white" transform="translate(154.93 107.311)" />
    </clipPath>
  </svg>
);
