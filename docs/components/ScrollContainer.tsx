import { mergeClasses } from '@expo/styleguide';
import { Component, createRef, PropsWithChildren } from 'react';

type ScrollContainerProps = PropsWithChildren<{
  className?: string;
  scrollPosition?: number;
  scrollHandler?: () => void;
}>;

export class ScrollContainer extends Component<ScrollContainerProps> {
  scrollRef = createRef<HTMLDivElement>();

  componentDidMount() {
    if (this.props.scrollPosition && this.scrollRef.current) {
      this.scrollRef.current.scrollTop = this.props.scrollPosition;
    }
  }

  public getScrollTop = () => {
    return this.scrollRef.current?.scrollTop ?? 0;
  };

  public getScrollRef = () => {
    return this.scrollRef;
  };

  render() {
    return (
      <div
        className={mergeClasses(
          'size-full overflow-y-auto overflow-x-hidden',
          this.props.className
        )}
        ref={this.scrollRef}
        onScroll={this.props.scrollHandler}>
        {this.props.children}
      </div>
    );
  }
}
