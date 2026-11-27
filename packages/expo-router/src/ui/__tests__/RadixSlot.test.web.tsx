/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';

import { Slot } from '../RadixSlot';

afterEach(() => jest.restoreAllMocks());

describe('prop merging', () => {
  it('calls the child handler first and returns its result', () => {
    type ProbeProps = { children?: ReactNode; onSelect?: (value: string) => string };
    const renderProbe = jest.fn((_props: ProbeProps) => null);
    const Probe = (props: ProbeProps) => renderProbe(props);
    // Slot forwards handler arguments unchanged, including custom component arguments.
    const ProbeSlot = Slot as ComponentType<ProbeProps>;
    const calls: string[] = [];
    const slotHandler = jest.fn(() => {
      calls.push('slot');
      return 'slot-result';
    });
    const childHandler = jest.fn(() => {
      calls.push('child');
      return 'child-result';
    });

    render(
      <ProbeSlot onSelect={slotHandler}>
        <Probe onSelect={childHandler} />
      </ProbeSlot>
    );

    // The first argument of the first render is the merged props object.
    const result = renderProbe.mock.calls[0]?.[0].onSelect?.('x');
    expect(calls).toEqual(['child', 'slot']);
    expect(childHandler).toHaveBeenCalledWith('x');
    expect(slotHandler).toHaveBeenCalledWith('x');
    expect(result).toBe('child-result');
  });

  it('uses the slot handler when the child omits it', () => {
    const onClick = jest.fn();
    render(
      <Slot onClick={onClick}>
        <button data-testid="child" />
      </Slot>
    );

    fireEvent.click(screen.getByTestId('child'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses the slot handler when the child handler is undefined', () => {
    const onClick = jest.fn();
    render(
      <Slot onClick={onClick}>
        <button data-testid="child" onClick={undefined} />
      </Slot>
    );

    fireEvent.click(screen.getByTestId('child'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps the child handler when the slot omits it', () => {
    const onClick = jest.fn();
    render(
      <Slot>
        <button data-testid="child" onClick={onClick} />
      </Slot>
    );

    fireEvent.click(screen.getByTestId('child'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('merges style with the child style taking precedence', () => {
    render(
      <Slot style={{ color: 'red', padding: '1px' }}>
        <div data-testid="child" style={{ color: 'blue' }} />
      </Slot>
    );

    const child = screen.getByTestId('child');
    expect(child.style.color).toBe('blue');
    expect(child.style.padding).toBe('1px');
  });

  it('joins class names with the slot class first', () => {
    render(
      <Slot className="slot">
        <div data-testid="child" className="child" />
      </Slot>
    );

    expect(screen.getByTestId('child').className).toBe('slot child');
  });

  it('keeps the child class when the slot omits it', () => {
    render(
      <Slot>
        <div data-testid="child" className="child" />
      </Slot>
    );

    expect(screen.getByTestId('child').className).toBe('child');
  });

  it('gives ordinary child props precedence', () => {
    render(
      <Slot id="slot">
        <div data-testid="child" id="child" />
      </Slot>
    );

    expect(screen.getByTestId('child').id).toBe('child');
  });

  it('passes slot-only props to the child', () => {
    render(
      <Slot title="slot title" style={{ padding: '1px' }} className="slot">
        <div data-testid="child" />
      </Slot>
    );

    const child = screen.getByTestId('child');
    expect(child.title).toBe('slot title');
    expect(child.style.padding).toBe('1px');
    expect(child.className).toBe('slot');
  });
});

describe('refs', () => {
  it('attaches the slot and child refs to the same node', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = jest.fn();
    render(
      <Slot ref={slotRef}>
        <div data-testid="child" ref={childRef} />
      </Slot>
    );

    const child = screen.getByTestId('child');
    expect(slotRef.current).toBe(child);
    expect(childRef).toHaveBeenCalledWith(child);
  });

  it('clears both refs on unmount when neither returns a cleanup', () => {
    const slotRef = createRef<HTMLElement>();
    const childRef = jest.fn();
    const { unmount } = render(
      <Slot ref={slotRef}>
        <div ref={childRef} />
      </Slot>
    );

    unmount();

    expect(slotRef.current).toBeNull();
    expect(childRef).toHaveBeenLastCalledWith(null);
  });

  it('runs the ref cleanup and clears the object ref on unmount', () => {
    const slotRef = createRef<HTMLElement>();
    const cleanup = jest.fn();
    const childRef = jest.fn(() => cleanup);
    const { unmount } = render(
      <Slot ref={slotRef}>
        <div ref={childRef} />
      </Slot>
    );

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(childRef).toHaveBeenCalledTimes(1);
    expect(slotRef.current).toBeNull();
  });

  it('keeps the child ref stable when the slot has no ref', () => {
    const childRef = jest.fn();
    const { rerender } = render(
      <Slot>
        <div ref={childRef} />
      </Slot>
    );

    rerender(
      <Slot>
        <div ref={childRef} />
      </Slot>
    );

    expect(childRef).toHaveBeenCalledTimes(1);
  });

  it('renders a Fragment without forwarding the slot ref', () => {
    const slotRef = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <Slot ref={slotRef}>
        <>
          <div data-testid="inner" />
        </>
      </Slot>
    );

    expect(screen.getByTestId('inner')).toBeTruthy();
    expect(slotRef).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('children', () => {
  it('renders a single element without a wrapper', () => {
    const { container } = render(
      <Slot>
        <div data-testid="child" />
      </Slot>
    );

    expect(container.innerHTML).toBe('<div data-testid="child"></div>');
  });

  it('rejects multiple children', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      render(
        <Slot>
          <div />
          <div />
        </Slot>
      )
    ).toThrow(new Error('React.Children.only expected to receive a single React element child.'));
  });

  it('renders nothing for a text child', () => {
    const { container } = render(<Slot>text</Slot>);

    expect(container.innerHTML).toBe('');
  });

  it('unwraps a Flight-style lazy child and passes slot props to it', async () => {
    const lazyChild = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: Promise.resolve(<div data-testid="child" />),
    };
    // React's public node type omits the lazy node shape used by Flight, so cast through unknown.
    const child = lazyChild as unknown as ReactNode;
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <Slot id="slot">{child}</Slot>
        </Suspense>
      );
    });

    expect(screen.getByTestId('child').id).toBe('slot');
  });
});
