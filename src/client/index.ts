import './styles/index.scss';
import { Main } from './Main.elm';

import 'smoothscroll-polyfill';

const app = Main.embed(document.getElementById('elm-root'));

const throttle = (func, delay) => {
  let timeout = null;
  return (...args) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        func.call(this, ...args);
        timeout = null;
      }, delay);
    }
  };
};

app.ports.infoForOutside.subscribe(msg => {
  /* PATTERN MATCH ON THE INFO FOR OUTSIDE */
  switch (msg.tag) {
    case 'SaveModel':
      /* EVENTUALLY PERSIST THE MODEL TO SESSION STORAGE */
      const model = msg.data;
      window.sessionStorage.setItem('chrstntdd-persisted-session', JSON.stringify(model));
      break;
    case 'ScrollTo':
      const element = document.getElementById(msg.data);
      window.scroll({
        top: element.offsetTop,
        left: 0,
        behavior: 'smooth'
      });
      break;
    case 'ErrorLogRequested':
      console.error(msg.data);
      break;
    default:
      console.log('default branch hit');
  }
});

const sendScreenData = () => {
  const html = document.documentElement;
  const body = document.body;

  const screenData = {
    scrollTop: window.pageYOffset || html.scrollTop || body.scrollTop || 0,
    pageHeight: 
      Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      ),
    viewportHeight: html.clientHeight,
    viewportWidth: html.clientWidth
  };
  app.ports.infoForElm.send({ tag: 'ScrollOrResize', data: screenData });
};

(() => {
  sendScreenData();
  window.addEventListener('scroll', throttle(sendScreenData, 100));
  window.addEventListener('resize', throttle(sendScreenData, 100));
})();
