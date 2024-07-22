import { palette } from '@expo/styleguide-base';

export const SnackImage = () => (
  <svg
    className="absolute right-5 bottom-6"
    width="80"
    height="81"
    viewBox="0 0 80 81"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#inset-shadow)">
      <circle
        cx="68.2409"
        cy="15.9358"
        r="11.6439"
        className="fill-palette-orange7 dark:fill-palette-orange11"
      />
    </g>
    <g>
      <path
        d="M34.9717 40.887V80.8089L0.0400391 60.8479V20.926L34.9717 40.887Z"
        className="fill-palette-orange8"
      />
      <path
        d="M51.607 32.5704V10.946L34.9729 20.9265V40.8875L51.607 32.5704Z"
        className="fill-palette-orange11 dark:fill-palette-orange6"
      />
      <path
        d="M68.2403 40.8871L51.6062 32.5701L36.6355 40.8871L51.6062 49.2042L68.2403 40.8871Z"
        className="fill-palette-orange8"
      />
      <path
        d="M34.9729 40.8871V80.809L68.2412 60.848V40.8871L51.607 49.2042V30.9066L34.9729 40.8871Z"
        className="fill-palette-orange11 dark:fill-palette-orange6"
      />
      <path
        d="M34.9723 0.964966L0.0406494 20.9259L34.9723 40.8869L51.6064 30.9064L34.9723 20.9259L51.6064 10.9454L34.9723 0.964966Z"
        className="fill-palette-orange7 dark:fill-palette-orange11"
      />
    </g>
    <filter id="inset-shadow">
      <feOffset dx="1" dy="-3" />
      <feGaussianBlur stdDeviation="2.5" result="offset-blur" />
      <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
      <feFlood floodColor={palette.light.orange11} floodOpacity=".8" result="color" />
      <feComposite operator="in" in="color" in2="inverse" result="shadow" />
      <feComposite operator="over" in="shadow" in2="SourceGraphic" />
    </filter>
  </svg>
);
