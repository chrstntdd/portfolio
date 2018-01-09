require('./index.scss');
require('smoothscroll-polyfill').polyfill();
const Elm = require('./Main.elm');

var _window = window;
_window = (function(_window) {
  var _document = _window.document;
  var _body = _document.body;
  var _html = _document.documentElement;
  var app;
  var elmScrollTop = position => {
    _window.scroll({
      top: position,
      left: 0,
      behavior: 'smooth'
    });
  };
  var processScrollOrResize = () => {
    var screenData = {
      scrollTop: parseInt(_window.pageYOffset || _html.scrollTop || _body.scrollTop || 0),
      pageHeight: parseInt(
        Math.max(
          _body.scrollHeight,
          _body.offsetHeight,
          _html.clientHeight,
          _html.scrollHeight,
          _html.offsetHeight
        )
      ),
      viewportHeight: parseInt(_html.clientHeight),
      viewportWidth: parseInt(_html.clientWidth)
    };
    app.ports.scrollOrResize.send(screenData);
  };

  const getOffsetOfEl = el => {
    const element = _document.getElementById(el);
    app.ports.offsetTopVal.send({
      offsetTop: element.offsetTop,
      id_: element.id
    });
  };
  var scrollTimer = null;
  var lastScrollFireTime = 0;
  var minScrollTime = 200;
  var scrolledOrResized = () => {
    var now = new Date().getTime();
    if (now - lastScrollFireTime > 3 * minScrollTime) {
      processScrollOrResize();
      lastScrollFireTime = now;
    }
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      lastScrollFireTime = new Date().getTime();
      processScrollOrResize();
    }, minScrollTime);
  };
  var main = () => {
    app = Elm.Main.fullscreen();
    app.ports.scrollTop.subscribe(elmScrollTop);
    app.ports.offsetTop.subscribe(getOffsetOfEl);

    /* get document height on page load */
    _document.readyState && scrolledOrResized();
    _window.addEventListener('scroll', scrolledOrResized);
    _window.addEventListener('resize', scrolledOrResized);
  };
  return {
    main: main()
  };
})(_window);
