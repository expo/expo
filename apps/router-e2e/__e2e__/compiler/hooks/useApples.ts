// Overlaps with `useFruit` to test named exports have priority.
export function useFruit() {
  return `All Fruits are delicious!`;
}

export function useApples() {
  console.log(`Apples are great!`);
}
