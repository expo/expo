import { Link } from 'expo-router';

export default function Page() {
  return (
    <Link testID="links-one" href="/about">
      Link to about
    </Link>
  );
}
