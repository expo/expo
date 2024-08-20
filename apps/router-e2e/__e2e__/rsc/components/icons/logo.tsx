import clsx from 'clsx';

export default function LogoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${process.env.SITE_NAME} logo`}
      viewBox="0 0 32 28"
      {...props}
      className={clsx('h-4 w-4 fill-black dark:fill-white', props.className)}
    >
      <path d="M21.5758 9.75769L16 0L0 28H11.6255L21.5758 9.75769Z" />
      <path d="M26.2381 17.9167L20.7382 28H32L26.2381 17.9167Z" />
    </svg>
  );
}
