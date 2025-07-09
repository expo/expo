import { Link } from 'expo-router';

export default function RelativeFruit() {
  return (
    <>
      <Link testID="e2e-goto-banana" href="./banana">
        Go to banana
      </Link>
      <Link testID="e2e-goto-banana-relative-directory" href="./banana" relativeToDirectory>
        Go to banana (relative to directory)
      </Link>
    </>
  );
}
