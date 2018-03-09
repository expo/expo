import React from 'react';

export default class FreezePageScroll extends React.Component {
  // Make sure to unfreeze when unmounting the component
  componentWillUnmount() {
    this.freezeScrolling(false);
  }

  // Make sure to freeze if unmounted and re-mounted again while mouse is
  // still over the component
  register(ref) {
    if (!ref) return;

    const onMove = () => {
      this.freezeScrolling(true);
      ref.removeEventListener('mousemove', onMove);
    };

    ref.addEventListener('mousemove', onMove);
  }

  freezeScrolling(enable) {
    const { body } = document;
    if (enable) {
      // If already freezed we don't need to do anything
      if (/body\-freeze\-scroll/.test(body.className)) return;
      body.className = `body-freeze-scroll ${body.className}`;
    } else {
      body.className = body.className.replace('body-freeze-scroll', '').trim();
    }
  }

  render() {
    return (
      <div
        ref={r => this.register(r)}
        onMouseEnter={() => this.freezeScrolling(true)}
        onMouseLeave={() => this.freezeScrolling(false)}>
        {this.props.children}
        <style jsx global>{`
          .body-freeze-scroll {
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }
}
