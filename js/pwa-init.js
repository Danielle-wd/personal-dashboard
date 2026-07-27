/**
 * PWA Init - Injects manifest with correct MIME type for iOS
 * CloudStudio serves application/json instead of application/manifest+json,
 * so we create a blob URL with the correct MIME type.
 */
(function() {
  // Check if the current URL is served over a network we control
  // If manifest.json is already being served correctly, skip
  if (document.querySelector('link[rel="manifest"]')) {
    var existing = document.querySelector('link[rel="manifest"]');
    var href = existing.getAttribute('href');
    if (href && href.startsWith('blob:')) {
      return; // Already injected
    }
  }

  // Fetch manifest and re-serve with correct MIME type
  fetch('/manifest.json')
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var blob = new Blob([JSON.stringify(data)], { type: 'application/manifest+json' });
      var url = URL.createObjectURL(blob);

      // Remove old link and add new one
      var oldLink = document.querySelector('link[rel="manifest"]');
      if (oldLink) oldLink.remove();

      var link = document.createElement('link');
      link.rel = 'manifest';
      link.href = url;
      document.head.appendChild(link);
    })
    .catch(function() {
      // If fetch fails, leave the original manifest link as-is
    });
})();
