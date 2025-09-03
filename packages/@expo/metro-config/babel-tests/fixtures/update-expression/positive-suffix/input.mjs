export let diffLevel = 0;

export function diff() {
  if (!++diffLevel) {
    console.log("hey");
  }
}
