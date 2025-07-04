import { appendContentsInsideDeclarationBlock } from '../utils';

describe(appendContentsInsideDeclarationBlock, () => {
  it('should support class declaration', () => {
    const contents = `
public class App {
  public static void main(String[] args) {
    System.out.println("Hello App!");
  }
}`;

    const expectContents = `
public class App {
  public static void main(String[] args) {
    System.out.println("Hello App!");
  }

  public void foo() {
    System.out.println("Hello foo!");
  }
}`;

    expect(
      appendContentsInsideDeclarationBlock(
        contents,
        'public class App',
        `
  public void foo() {
    System.out.println("Hello foo!");
  }\n`
      )
    ).toEqual(expectContents);
  });

  it('should support method declaration', () => {
    const contents = `
public class App {
  public static void main(String[] args) {
    System.out.println("Hello App!");
  }
}`;

    const expectContents = `
public class App {
  public static void main(String[] args) {
    System.out.println("Hello App!");
    System.out.println("Hello from generated code.");
  }
}`;

    expect(
      appendContentsInsideDeclarationBlock(
        contents,
        'public static void main',
        '  System.out.println("Hello from generated code.");\n  '
      )
    ).toEqual(expectContents);
  });
});
