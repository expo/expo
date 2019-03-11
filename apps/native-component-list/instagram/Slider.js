import React from 'react';
import { FlatList, Dimensions, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewPager from './ViewPager';

const pages = ['Type', 'Music', 'Live', 'Normal', 'Boomerang', 'Rewind', 'Hands-Free'].map(value =>
  value.toUpperCase()
);

const { width } = Dimensions.get('window');
const HORIZONTAL_ITEM_WIDTH = 95;
// const width = HORIZONTAL_ITEM_WIDTH;
// const HORIZONTAL_ITEM_END_SPACE = (width - HORIZONTAL_ITEM_WIDTH) / 2;
const sliderHeight = 60;
export default class Slider extends React.Component {
  state = { index: 0 };

  get currentPage() {
    return this.pages[this.viewPager.index];
  }

  previous = () => {
    if (this.viewPager) {
      console.log(this.viewPager.index);
      this.viewPager.previous();
    }
  };

  next = () => {
    if (this.viewPager) {
      console.log(this.viewPager.index);
      this.viewPager.next();
    }
  };

  renderItem = ({ item, index }) => {
    // const marginLeft = index === 0 ? HORIZONTAL_ITEM_END_SPACE : 0;
    // const marginRight = index === pages.length - 1 ? HORIZONTAL_ITEM_END_SPACE : 0;
    return (
      <View
        style={{
          width,
          height: sliderHeight,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontWeight: 'bold',
            fontSize: 14,
            color: 'white',
            textAlign: 'center',
          }}
          key={item}>
          {item}
        </Text>
      </View>
    );
  };
  render() {
    return (
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={{ flex: 1, maxHeight: sliderHeight }}>
        <ViewPager
          pagingEnabled
          centerContent
          onMomentumScrollEnd={() => {
            // TODO: Bacon: PR this method into RNWeb
            // const { index } = this.viewPager;
            // console.log('eng', this.state.index, index);
            // if (this.state.index !== index) {
            //   this.props.onIndexChange(index, this.state.index);
            //   this.setState({ index });
            // }
          }}
          onScroll={({ value }) => {
            // console.log('scroll', value);
            const { index } = this.viewPager;
            if (this.state.index !== index) {
              // console.log('eng', this.state.index, index);
              this.setState({ index }, () => {
                this.props.onIndexChange(index, this.state.index);
              });
            }
          }}
          ref={ref => (this.viewPager = ref)}
          data={this.props.data}
          renderItem={this.renderItem}
          style={{ flex: 1 }}
          size={width}
          horizontal
        />
      </LinearGradient>
    );
  }
}
