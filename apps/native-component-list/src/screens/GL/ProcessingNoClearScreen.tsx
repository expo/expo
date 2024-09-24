import ProcessingWrap from './ProcessingWrap';

export default ProcessingWrap<object>('Draw without clearing screen with processing.js', (p) => {
  let t = 0;

  p.setup = () => {
    p.background(0);
    p.noStroke();
  };

  p.draw = () => {
    t += 12;
    p.translate(p.width * 0.5, p.height * 0.5);
    p.fill(
      128 * (1 + p.sin(0.004 * t)),
      128 * (1 + p.sin(0.005 * t)),
      128 * (1 + p.sin(0.007 * t))
    );
    p.ellipse(
      0.25 * p.width * p.cos(0.002 * t),
      0.25 * p.height * p.sin(0.002 * t),
      0.1 * p.width * (1 + p.sin(0.003 * t)),
      0.1 * p.width * (1 + p.sin(0.003 * t))
    );
  };
});
