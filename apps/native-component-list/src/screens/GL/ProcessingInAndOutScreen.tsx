import ProcessingWrap from './ProcessingWrap';

export default ProcessingWrap<object>(`'In and out' from openprocessing.org`, (p) => {
  p.setup = () => {
    p.strokeWeight(7);
  };

  const harom = (ax: number, ay: number, bx: number, by: number, level: number, ratio: number) => {
    if (level <= 0) {
      return;
    }

    const vx = bx - ax;
    const vy = by - ay;
    const nx = p.cos(p.PI / 3) * vx - p.sin(p.PI / 3) * vy;
    const ny = p.sin(p.PI / 3) * vx + p.cos(p.PI / 3) * vy;
    const cx = ax + nx;
    const cy = ay + ny;
    p.line(ax, ay, bx, by);
    p.line(ax, ay, cx, cy);
    p.line(cx, cy, bx, by);

    harom(
      ax * ratio + cx * (1 - ratio),
      ay * ratio + cy * (1 - ratio),
      ax * (1 - ratio) + bx * ratio,
      ay * (1 - ratio) + by * ratio,
      level - 1,
      ratio
    );
  };

  p.draw = () => {
    p.background(240);
    harom(
      p.width - 142,
      p.height - 142,
      142,
      p.height - 142,
      6,
      (p.sin((0.0005 * Date.now()) % (2 * p.PI)) + 1) / 2
    );
  };
});
