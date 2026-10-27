'use strict';
{
  window.C3_RegisterSW = async function C3_RegisterSW() {
    if (!navigator.serviceWorker || location.protocol === 'blob:' || location.protocol === 'file:') return;
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
      console.info('Registered service worker on ' + reg.scope);
    } catch (err) {
      console.warn('Service worker registration bypassed: ', err);
    }
  };
}
