type PermalinkIconProps = {
  onClick?: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  className?: string;
};

// note(Keith): Do not replace with a styleguide-icon version.
// None of the available options look quite right in docs.
// This icon should instead be eventually added to @expo/styleguide-icons.
export function PermalinkIcon({ onClick, className }: PermalinkIconProps) {
  return (
    <svg
      onClick={onClick}
      aria-label="permalink"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke="#9B9B9B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="#9B9B9B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
