import { theme } from '@expo/styleguide';
import React from 'react';

export const WhyImage = () => (
  <svg
    style={{
      position: 'absolute',
      right: 20,
      bottom: 20,
    }}
    width="135"
    height="77"
    viewBox="0 0 135 77"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M72.7084 38.4707C72.7084 57.7122 57.1101 73.3104 37.8687 73.3104C18.6272 73.3104 3.02893 57.7122 3.02893 38.4707C3.02893 19.2293 18.6272 3.63098 37.8687 3.63098C57.1101 3.63098 72.7084 19.2293 72.7084 38.4707Z"
      fill={theme.palette.green4}
      stroke={theme.palette.green7}
      strokeWidth="6"
    />
    <path
      d="M131.699 38.4707C131.699 57.7122 116.101 73.3104 96.8597 73.3104C77.6183 73.3104 62.02 57.7122 62.02 38.4707C62.02 19.2293 77.6183 3.63098 96.8597 3.63098C116.101 3.63098 131.699 19.2293 131.699 38.4707Z"
      fill={theme.palette.green5}
      stroke={theme.palette.green7}
      strokeWidth="6"
    />
    <path d="M96.8596 25.7819V51.1596" stroke="#28A745" strokeWidth="6.67" strokeLinecap="round" />
    <path
      d="M84.1716 38.4708L109.549 38.4708"
      stroke="#28A745"
      strokeWidth="6.67"
      strokeLinecap="round"
    />
    <path
      d="M25.1804 38.4708L50.5581 38.4708"
      stroke="#28A745"
      strokeWidth="6.67"
      strokeLinecap="round"
    />
  </svg>
);
