!(function(t) {
  (t.f[1] = function(e, n) {
    Object.defineProperty(n, '__esModule', { value: !0 }), t.r(2);
    var o = { slider0: 0, slider1: 0, slider2: 0 };
    document.addEventListener('DOMContentLoaded', function(t) {
      i();
      var e = document.getElementById('about'),
        n = document.getElementById('portfolio'),
        o = document.getElementById('contact'),
        d = document.getElementById('nav-id');
      (document.getElementById('about-link').onclick = function(t) {
        t.preventDefault(), c(document.body, e.offsetTop, 450);
      }),
        (document.getElementById('portfolio-link').onclick = function(t) {
          t.preventDefault(), c(document.body, n.offsetTop - 50, 450);
        }),
        (document.getElementById('contact-link').onclick = function(t) {
          t.preventDefault(), c(document.body, o.offsetTop, 450);
        }),
        (window.onscroll = function() {
          var t =
            void 0 !== window.pageYOffset
              ? window.pageYOffset
              : (document.documentElement ||
                  document.body.parentNode ||
                  document.body).scrollTop;
          d.className = t > 120 ? 'nav-container sticky' : 'nav-container';
        });
    });
    var c = function(t, e, n) {
        var o,
          c = t.scrollTop,
          i = e - c,
          r = function(e) {
            var a = d((e += 20), c, i, n);
            (t.scrollTop = a),
              e < n &&
                (o = setTimeout(function() {
                  return r(e);
                }, 20));
          };
        r(0);
      },
      d = function(t, e, n, o) {
        return (t /= o / 2) < 1
          ? n / 2 * t * t + e
          : ((t -= 1), -n / 2 * (t * (t - 2) - 1) + e);
      },
      i = function() {
        Array.from(document.getElementsByClassName('slider')).forEach(function(
          t
        ) {
          var c = t.getElementsByTagName('button');
          Array.from(c).forEach(function(t, c) {
            0 === c
              ? t.addEventListener('click', function(e) {
                  if ('BUTTON' === e.srcElement.tagName) {
                    var c = e.target.id,
                      d = 'slider' + Number(c.match(/\d/)[0]);
                    n(t.id, o[d]);
                  }
                })
              : t.addEventListener('click', function(n) {
                  if ('BUTTON' === n.srcElement.tagName) {
                    var c = n.target.id,
                      d = 'slider' + Number(c.match(/\d/)[0]);
                    e(t.id, o[d]);
                  }
                });
          });
        });
        var t = function(t, e) {
            t.style.transform =
              'translate3d(' + -e * t.offsetWidth + 'px, 0 , 0)';
          },
          e = function(e, n) {
            console.log('what');
            var c = e.match(/\d/)[0],
              d = n + 1,
              i = Math.min(d, 2);
            o['slider' + c] = i;
            var r = document.getElementById('imgThumbList' + c);
            t(r, i);
          },
          n = function(e, n) {
            var c = e.match(/\d/)[0],
              d = n - 1,
              i = Math.max(d, 0);
            o['slider' + c] = i;
            var r = document.getElementById('imgThumbList' + c);
            t(r, i);
          };
      };
  }),
    (t.f[2] = function() {
      t.r(0)('index.css');
    }),
    t.r(1);
})($fsx);
