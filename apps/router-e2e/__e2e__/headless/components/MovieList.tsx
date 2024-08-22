import { Link } from 'expo-router';

export function MovieList() {
  return (
    <>
      <Link href="/movies/Toy Story">Toy Story</Link>
      <Link href="/movies/A Bugs Life">A Bugs Life</Link>
      <Link href="/movies/Monsters Inc">Monsters Inc.</Link>
    </>
  );
}
