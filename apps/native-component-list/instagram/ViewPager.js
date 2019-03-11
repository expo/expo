import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Animated, FlatList } from 'react-native';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
class ViewPager extends Component {
  static propTypes = {
    size: PropTypes.number,
    data: PropTypes.array.isRequired,
    renderItem: PropTypes.func.isRequired,
  };

  static defaultProps = {
    decelerationRate: 0,
    keyExtractor: (item, index) => `vp-${index}`,
    onScroll: () => {},
    snapToAlignment: 'start',
    onEndReachedThreshold: 50,
    horizontal: true,
    useNativeDriver: true,
    scroll: new Animated.Value(0),
  };

  get size() {
    const { size, horizontal } = this.props;
    if (size) {
      return size;
    } else {
      const { width, height } = this.state;
      return horizontal ? width : height;
    }
  }

  get offset() {
    const { scroll } = this.props;
    const offset = scroll._value;
    return offset;
  }

  get index() {
    return Math.round(this.offset / this.size);
  }

  set index(index) {
    this.scrollToIndex({ index });
  }

  constructor(props) {
    super(props);
    const { scroll, horizontal, size, useNativeDriver } = props;
    scroll.addListener(event => this.props.onScroll(event));

    this.state = {
      width: horizontal ? size : 0,
      height: !horizontal ? size : 0,
      onScroll: this.setupOnScroll(useNativeDriver, horizontal),
    };
  }

  get node() {
    if (!this.list || !this.list.getNode) {
      return null;
    }
    return this.list.getNode();
  }

  scrollToIndex = ({ index, animated }) => {
    if (this.node) {
      console.log('scrollto', index, animated, Object.keys(this.node));
      const { data } = this.props;
      const maxItems = data.length - 1;
      this.node.scrollToIndex({
        animated,
        index: Math.max(0, Math.min(index, maxItems)),
      });
    }
  };

  next = animated => this.scrollToIndex({ index: this.index + 1, animated });

  previous = animated => this.scrollToIndex({ index: this.index - 1, animated });

  setupOnScroll = (useNativeDriver, horizontal) => {
    const key = horizontal ? 'x' : 'y';
    return Animated.event(
      [
        {
          nativeEvent: { contentOffset: { [key]: this.props.scroll } },
        },
      ],
      {
        useNativeDriver,
      }
    );
  };
  componentWillReceiveProps(nextProps) {
    const { props } = this;
    if (
      nextProps.useNativeDriver != props.useNativeDriver ||
      nextProps.horizontal != props.horizontal
    ) {
      this.setState({
        onScroll: this.setupOnScroll(nextProps.useNativeDriver, nextProps.horizontal),
      });
    }
  }

  keyExtractor = (item, index) => index;

  getItemLayout = (data, index) => {
    return {
      length: this.size,
      offset: this.size * index,
      index,
    };
  };

  get contentContainerStyle() {
    const { horizontal } = this.props;

    if (horizontal) {
      const offset = (this.state.width - this.size) / 2;
      return {
        paddingHorizontal: offset,
      };
    } else {
      const offset = (this.state.height - this.size) / 2;
      return {
        paddingVertical: offset,
      };
    }
  }

  onLayout = event => {
    const { onLayout, horizontal } = this.props;
    const {
      nativeEvent: {
        layout: { width, height },
      },
    } = event;

    if (horizontal) {
      if (width != this.state.width) {
        console.log('horizontal', width);
        this.setState({ width, height });
      }
    } else {
      if (height != this.state.height) {
        console.log('vertical', height);
        this.setState({ width, height });
      }
    }

    onLayout && onLayout(event);
  };

  render() {
    const {
      data,
      onScroll,
      renderItem,
      onRef,
      getItemLayout,
      snapToAlignment,
      keyExtractor,
      contentContainerStyle,
      onRefresh,
      refreshing,
      decelerationRate,
      onEndReached,
      onEndReachedThreshold,
      onLayout,
      ...props
    } = this.props;

    return (
      <AnimatedFlatList
        onLayout={this.onLayout}
        onScroll={this.state.onScroll}
        ref={ref => {
          this.list = ref;
          onRef && onRef(ref);
        }}
        keyExtractor={keyExtractor || this.keyExtractor}
        data={data}
        snapToAlignment={snapToAlignment}
        snapToInterval={this.size}
        decelerationRate={decelerationRate}
        contentContainerStyle={[this.contentContainerStyle, contentContainerStyle]}
        getItemLayout={getItemLayout || this.getItemLayout}
        renderItem={renderItem}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        showsHorizontalScrollIndicator={false}
        onEndReachedThreshold={onEndReachedThreshold}
        {...props}
      />
    );
  }
}

export default ViewPager;
