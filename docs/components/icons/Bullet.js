import * as React from 'react';

// TODO(jim): Some of these styles are affected globally when under an li.
const Bullet = () => (
  <svg
    className="bullet-icon"
    aria-hidden="true"
    height="16"
    version="1.1"
    viewBox="0 0 16 16"
    width="16">
    <circle cx="8" cy="8" r="3" />
  </svg>
);

export default Bullet;
