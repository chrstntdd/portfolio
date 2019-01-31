module.exports = `
  <script type='text/javascript'>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker
          .register('/sw.js')
          .catch(function (registrationError) {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  </script>
  `
