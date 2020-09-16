import * as React from 'react';

const ChevronDown = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height={props.size}
    width={props.size}
    style={props.style}
    className={props.className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default ChevronDown;
