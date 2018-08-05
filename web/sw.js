self.addEventListener('fetch', event => {
  return fetch(event.request);
});

self.addEventListener('beforeinstallprompt', event => {
});
