import React from 'react';

export const SnackImage = () => (
  <svg
    style={{
      position: 'absolute',
      right: 20,
      bottom: 24,
    }}
    width="80"
    height="81"
    viewBox="0 0 80 81"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#f0cd9fa4924e22267af4fdde31d18ea1)">
      <circle
        cx="68.2409"
        cy="15.9358"
        r="11.6439"
        css={{ fill: 'var(--purple7)', '.dark-theme &': { fill: 'var(--purple11)' } }}
      />
    </g>
    <g>
      <path
        d="M34.9717 40.887V80.8089L0.0400391 60.8479V20.926L34.9717 40.887Z"
        css={{ fill: 'var(--purple8)', '.dark-theme &': { fill: 'var(--purple8)' } }}
      />
      <path
        d="M51.607 32.5704V10.946L34.9729 20.9265V40.8875L51.607 32.5704Z"
        css={{ fill: 'var(--purple11)', '.dark-theme &': { fill: 'var(--purple6)' } }}
      />
      <path
        d="M68.2403 40.8871L51.6062 32.5701L36.6355 40.8871L51.6062 49.2042L68.2403 40.8871Z"
        fill="var(--purple8)"
      />
      <path
        d="M34.9729 40.8871V80.809L68.2412 60.848V40.8871L51.607 49.2042V30.9066L34.9729 40.8871Z"
        css={{ fill: 'var(--purple11)', '.dark-theme &': { fill: 'var(--purple6)' } }}
      />
      <path
        d="M34.9723 0.964966L0.0406494 20.9259L34.9723 40.8869L51.6064 30.9064L34.9723 20.9259L51.6064 10.9454L34.9723 0.964966Z"
        css={{ fill: 'var(--purple7)', '.dark-theme &': { fill: 'var(--purple11)' } }}
      />
    </g>
    <defs>
      <filter
        id="f0cd9fa4924e22267af4fdde31d18ea1"
        x="56.597"
        y="1.57089"
        width="23.2878"
        height="26.0087"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="-2.72098" />
        <feGaussianBlur stdDeviation="2.72098" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_39:1494" />
      </filter>
    </defs>
  </svg>
);
