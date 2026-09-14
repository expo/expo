"""Compile the actual collection layout in isolation and exercise UIKit query ordering.

Run from any directory with --device set to a booted iOS simulator UUID.
No React runtime or application launch is needed.
"""
import argparse
import platform
import subprocess
import tempfile
from pathlib import Path

s=(Path(__file__).resolve().parents[1] / 'ios/SynchronousCollectionList/ExpoUISynchronousCollectionRow.mm').read_text()
a=s.index('@implementation ExpoUISynchronousCollectionLayout'); b=s.index('@end',a)+4
head='''#import <UIKit/UIKit.h>
#include <algorithm>
#include <vector>
@interface ExpoUISynchronousCollectionLayout : UICollectionViewLayout
- (void)resetMeasurements;
@end
'''
test='''
@interface TestData : NSObject <UICollectionViewDataSource>
@end
@implementation TestData
- (NSInteger)collectionView:(UICollectionView *)view numberOfItemsInSection:(NSInteger)section { return 100; }
- (UICollectionViewCell *)collectionView:(UICollectionView *)view cellForItemAtIndexPath:(NSIndexPath *)index { return [view dequeueReusableCellWithReuseIdentifier:@"cell" forIndexPath:index]; }
@end
int main() {
  @autoreleasepool {
    TestData *data = [TestData new];
    ExpoUISynchronousCollectionLayout *layout = [ExpoUISynchronousCollectionLayout new];
    UICollectionView *view = [[UICollectionView alloc] initWithFrame:CGRectMake(0, 0, 400, 600) collectionViewLayout:layout];
    view.dataSource = data;
    [view registerClass:UICollectionViewCell.class forCellWithReuseIdentifier:@"cell"];
    [view reloadData];
    [layout prepareLayout];
    auto path = [](NSInteger i) { return [NSIndexPath indexPathForItem:i inSection:0]; };
    auto original = [layout layoutAttributesForItemAtIndexPath:path(1)];
    UICollectionViewLayoutAttributes *preferred = [original copy];
    preferred.size = CGSizeMake(400, 180);
    [layout invalidationContextForPreferredLayoutAttributes:preferred withOriginalAttributes:original];
    // UIKit may ask for attributes again before calling prepareLayout.
    auto next = [layout layoutAttributesForItemAtIndexPath:path(2)];
    printf("after 120->180: next origin=%.1f expected=300, content height=%.1f expected=12060\\n", next.frame.origin.y, layout.collectionViewContentSize.height);
    if (fabs(next.frame.origin.y - 300) > 0.01 || fabs(layout.collectionViewContentSize.height - 12060) > 0.01) return 1;
    original = [layout layoutAttributesForItemAtIndexPath:path(1)];
    preferred = [original copy]; preferred.size = CGSizeMake(400, 90);
    [layout invalidationContextForPreferredLayoutAttributes:preferred withOriginalAttributes:original];
    NSArray *visible = [layout layoutAttributesForElementsInRect:CGRectMake(0, 210, 400, 120)];
    next = [layout layoutAttributesForItemAtIndexPath:path(2)];
    if (fabs(next.frame.origin.y - 210) > 0.01 || visible.count != 1 || ((UICollectionViewLayoutAttributes *)visible.firstObject).indexPath.item != 2) return 2;
    puts("PASS: growth, shrinkage, viewport lookup, and content extent before prepareLayout");
  }
  return 0;
}
'''
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--device', required=True, help='Booted iOS simulator UUID')
args = parser.parse_args()
sdk = subprocess.check_output(
    ['xcrun', '--sdk', 'iphonesimulator', '--show-sdk-path'], text=True
).strip()
with tempfile.TemporaryDirectory(prefix='collection-layout-test-', dir='/tmp') as directory:
    source = Path(directory) / 'test.mm'
    executable = Path(directory) / 'test'
    source.write_text(head+s[a:b]+test)
    subprocess.run([
        'xcrun', 'clang++', '-target', f'{platform.machine()}-apple-ios16.4-simulator',
        '-isysroot', sdk, '-fobjc-arc', '-std=c++20',
        '-framework', 'UIKit', '-framework', 'Foundation', '-framework', 'CoreGraphics',
        str(source), '-o', str(executable)
    ], check=True)
    subprocess.run(['xcrun', 'simctl', 'spawn', args.device, str(executable)], check=True)
