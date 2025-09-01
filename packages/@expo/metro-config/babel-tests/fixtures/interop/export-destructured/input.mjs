export let x = 0;
export let y = 0;

export function f1 () {
  ({x} = { x: 1 });
}

export function f2 () {
  ({x, y} = { x: 2, y: 3 });
}

export function f3 () {
  [x, y, z] = [3, 4, 5]
}

export function f4 () {
  [x, , y] = [3, 4, 5]
}
