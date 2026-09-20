/**
 * YouTube NonStop – Content Script
 * Targets both YouTube and YouTube Music.
 *
 * This script detects the "Are you still watching?" dialog and automatically clicks the "Yes" button to resume playback.
 * Developed by @nextnode, intended for a fair use of YouTube's service. This script is not affiliated with or endorsed by YouTube or Google.
 */

(function () {
  'use strict';

  const BUTTON_SELECTORS = [
    'yt-confirm-dialog-renderer button.yt-spec-button-shape-next--call-to-action',
    'tp-yt-paper-dialog button.yt-spec-button-shape-next--call-to-action',
    'ytd-mealbar-promo-renderer button.yt-spec-button-shape-next--call-to-action',
    'ytmusic-you-there-renderer button',
    'button.yt-spec-button-shape-next--call-to-action',
  ];

  const OVERLAY_SELECTORS = [
    'yt-confirm-dialog-renderer',
    'tp-yt-paper-dialog[aria-modal="true"]',
    'ytd-mealbar-promo-renderer',
    'ytmusic-you-there-renderer',
    '.ytd-mealbar-promo-renderer',
  ];

  const TRIGGER_PHRASES = [
    'still watching',
    'video paused',
    'continue watching',
    'are you there',
    'ancora qui',        
    'noch da',           
    'toujours là',       
    'ainda assistindo',  
    'todavía viendo',
  ];

  let enabled = true;

  function log(...args) {
    console.debug('[YT NonStop]', ...args);
  }

  function isStillWatchingDialog(el) {
    if (!el) return false;
    const text = (el.innerText || '').toLowerCase();
    return TRIGGER_PHRASES.some(phrase => text.includes(phrase));
  }

  function dismissPopup() {
    if (!enabled) return;

    for (const sel of BUTTON_SELECTORS) {
      const btn = document.querySelector(sel);
      if (btn && isStillWatchingDialog(btn.closest('tp-yt-paper-dialog, yt-confirm-dialog-renderer, ytd-mealbar-promo-renderer, ytmusic-you-there-renderer') || btn)) {
        log('Clicking dismiss button:', sel);
        btn.click();
        resumeVideo();
        return;
      }
    }

    const allButtons = document.querySelectorAll('button, yt-button-renderer');
    for (const btn of allButtons) {
      const text = (btn.innerText || '').toLowerCase();
      if (TRIGGER_PHRASES.some(p => text.includes(p))) {
        log('Fallback button click:', btn);
        btn.click();
        resumeVideo();
        return;
      }
    }
  }

  function resumeVideo() {
    setTimeout(() => {
      const video = document.querySelector('video');
      if (video && video.paused) {
        log('Resuming paused video');
        video.play().catch(() => {});
      }
    }, 300);
  }

  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (OVERLAY_SELECTORS.some(sel => node.matches?.(sel))) {
          if (isStillWatchingDialog(node)) {
            log('Overlay detected (addedNode):', node);
            dismissPopup();
            return;
          }
        }
      
        if (node.querySelector) {
          for (const sel of OVERLAY_SELECTORS) {
            const found = node.querySelector(sel);
            if (found && isStillWatchingDialog(found)) {
              log('Overlay detected (descendant):', found);
              dismissPopup();
              return;
            }
          }
        }
      }

      if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (OVERLAY_SELECTORS.some(sel => target.matches?.(sel))) {
          const hidden = target.hasAttribute('hidden') || target.style.display === 'none';
          if (!hidden && isStillWatchingDialog(target)) {
            log('Overlay shown via attribute change:', target);
            dismissPopup();
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden', 'style', 'class'],
  });

  setInterval(() => {
    if (!enabled) return;
    dismissPopup();
  }, 1500);

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get({ enabled: true }, (result) => {
      enabled = result.enabled;
      log('Extension enabled:', enabled);
    });

    chrome.storage.onChanged.addListener((changes) => {
      if ('enabled' in changes) {
        enabled = changes.enabled.newValue;
        log('Toggled:', enabled);
      }
    });
  }

  log('Loaded on', location.hostname);
})();
