import './index.scss';

const d = document;
const body = document.body;
const state = {
  slider0: 0,
  slider1: 0,
  slider2: 0
};
/* $document.ready */
d.addEventListener('DOMContentLoaded', event => {
  /* grab pertinent elements */
  const about = d.getElementById('about');
  const port = d.getElementById('portfolio');
  const contact = d.getElementById('contact');
  const nav = d.getElementById('nav-id');

  /* Attach onClick handlers to each link for scrollTo feature */
  d.getElementById('about-link').onclick = e => {
    e.preventDefault();
    scrollTo(d.body, about.offsetTop, 450);
  };
  d.getElementById('portfolio-link').onclick = e => {
    e.preventDefault();
    scrollTo(d.body, port.offsetTop - 50, 450);
  };
  d.getElementById('contact-link').onclick = e => {
    e.preventDefault();
    scrollTo(d.body, contact.offsetTop, 450);
  };

  /* check for when to show navigation */
  window.onscroll = () => {
    const scrollTop =
      window.pageYOffset !== undefined
        ? window.pageYOffset
        : (document.documentElement ||
            document.body.parentNode ||
            document.body).scrollTop;
    scrollTop > 120
      ? (nav.className = 'nav-container sticky')
      : (nav.className = 'nav-container');
  };
});
/* Utility scroll to function */
const scrollTo = (element: HTMLElement, to: number, duration: number) => {
  const start = element.scrollTop;
  const change = to - start;
  const increment = 20;
  let timeOut;

  const animateScroll = elapsedTime => {
    elapsedTime += increment;
    const position = easeInOut(elapsedTime, start, change, duration);
    element.scrollTop = position;
    if (elapsedTime < duration) {
      timeOut = setTimeout(() => animateScroll(elapsedTime), increment);
    }
  };

  animateScroll(0);
};

const easeInOut = (currentTime, start, change, duration) => {
  currentTime /= duration / 2;
  if (currentTime < 1) {
    return change / 2 * currentTime * currentTime + start;
  }
  currentTime -= 1;
  return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
  const attachSliderHandlers = (): void => {
    const sliders = Array.from(d.getElementsByClassName('slider'));

    sliders.forEach(slider => {
      const buttons = slider.getElementsByTagName('button');

      Array.from(buttons).forEach((button, i) => {
        i === 0
          ? button.addEventListener('click', e => {
              if (e.srcElement.tagName !== 'BUTTON') {
                return;
              } else {
                const buttonId = e.target.id;
                const stateKey = `slider${Number(buttonId.match(/\d/)[0])}`;

                prevThumb(button.id, state[stateKey]);
              }
            })
          : button.addEventListener('click', e => {
              if (e.srcElement.tagName !== 'BUTTON') {
                return;
              } else {
                const buttonId = e.target.id;
                const stateKey = `slider${Number(buttonId.match(/\d/)[0])}`;

                nextThumb(button.id, state[stateKey]);
              }
            });
      });
    });

    /* animates the image */
    const setTransform = (el: HTMLElement, nextIndex: number) => {
      el.style['transform'] = `translate3d(${-(
        nextIndex * el.offsetWidth
      )}px, 0 , 0)`;
    };

    /* Increment current slider's index of visible picture and call to setTransform animation */
    const nextThumb = (buttonId: string, currentIndex: number): void => {
      const btnIndex = buttonId.match(/\d/)[0];
      const nextIndex = currentIndex + 1;
      const pos = Math.min(nextIndex, 2);
      state[`slider${btnIndex}`] = pos;

      const list = d.getElementById(`imgThumbList${btnIndex}`);
      setTransform(list, pos);
    };

    /* Decrement current slider's index of visible picture and call to setTransform animation */
    const prevThumb = (buttonId: string, currentIndex: number): void => {
      const btnIndex = buttonId.match(/\d/)[0];
      const nextIndex = currentIndex - 1;
      const pos = Math.max(nextIndex, 0);
      state[`slider${btnIndex}`] = pos;

      const list = d.getElementById(`imgThumbList${btnIndex}`);
      setTransform(list, pos);
    };
  };
  attachSliderHandlers();
};
