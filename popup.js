(function () {
  const toggle = document.getElementById('toggle');
  const dot    = document.getElementById('statusDot');
  const text   = document.getElementById('statusText');

  function updateUI(enabled) {
    toggle.checked = enabled;
    if (enabled) {
      dot.classList.remove('off');
      text.textContent = 'Active and watching for popups';
    } else {
      dot.classList.add('off');
      text.textContent = 'Disabled – popups will not be dismissed';
    }
  }

  // Load saved state
  chrome.storage.sync.get({ enabled: true }, (result) => {
    updateUI(result.enabled);
  });

  // Save on toggle
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled });
    updateUI(enabled);
  });
})();
