import ImageManipulatorContext from '../ImageManipulatorContext.web';
import ImageManipulatorImageRef from '../ImageManipulatorImageRef.web';

function addTask(
  context: ImageManipulatorContext,
  task: (canvas: HTMLCanvasElement) => HTMLCanvasElement | Promise<HTMLCanvasElement>
): void {
  (
    context as unknown as {
      addTask: (
        task: (canvas: HTMLCanvasElement) => HTMLCanvasElement | Promise<HTMLCanvasElement>
      ) => void;
    }
  ).addTask(task);
}

describe('release', () => {
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let revokeObjectURL: jest.Mock;

  beforeEach(() => {
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('releases the context canvas after pending work settles', async () => {
    const canvas = { width: 100, height: 50 } as HTMLCanvasElement;
    const context = new ImageManipulatorContext(() => canvas);
    const task = context.currentTask;

    context.release();
    await task;

    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    expect(() => context.reset()).toThrow('Cannot use shared object that was already released');
  });

  it('releases the previous context canvas when resetting', async () => {
    const firstCanvas = { width: 100, height: 50 } as HTMLCanvasElement;
    const secondCanvas = { width: 200, height: 100 } as HTMLCanvasElement;
    const loader = jest.fn().mockReturnValueOnce(firstCanvas).mockReturnValueOnce(secondCanvas);
    const context = new ImageManipulatorContext(loader);
    const firstTask = context.currentTask;

    context.reset();
    await firstTask;

    expect(firstCanvas.width).toBe(0);
    expect(firstCanvas.height).toBe(0);
    await expect(context.currentTask).resolves.toBe(secondCanvas);
  });

  it('releases a canvas returned by a failed context task', async () => {
    if (typeof document === 'undefined') {
      return;
    }
    const canvas = document.createElement('canvas');
    const context = new ImageManipulatorContext(() => Promise.reject(canvas));
    const task = context.currentTask;

    context.release();
    await expect(task).rejects.toBe(canvas);

    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it('releases a canvas replaced by an action', async () => {
    const sourceCanvas = { width: 100, height: 50 } as HTMLCanvasElement;
    const resultCanvas = { width: 50, height: 25 } as HTMLCanvasElement;
    const context = new ImageManipulatorContext(() => sourceCanvas);

    addTask(context, () => resultCanvas);
    await expect(context.currentTask).resolves.toBe(resultCanvas);

    expect(sourceCanvas.width).toBe(0);
    expect(sourceCanvas.height).toBe(0);
  });

  it('releases an action input canvas when the action fails', async () => {
    const canvas = { width: 100, height: 50 } as HTMLCanvasElement;
    const error = new Error('Failed to resize');
    const context = new ImageManipulatorContext(() => canvas);

    addTask(context, () => {
      throw error;
    });
    await expect(context.currentTask).rejects.toBe(error);

    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
  });

  it.each(['blob:image', 'BLOB:image', 'Blob:image'])('releases %s only once', (uri) => {
    const canvas = { width: 100, height: 50 } as HTMLCanvasElement;
    const image = new ImageManipulatorImageRef(uri, canvas);

    image.release();
    image.release();

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(uri);
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    expect(() => image.width).toThrow('Cannot use shared object that was already released');
  });

  it('does not revoke a data URL', () => {
    const image = new ImageManipulatorImageRef('data:image/png;base64,example', {
      width: 100,
      height: 50,
    } as HTMLCanvasElement);

    image.release();

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});
