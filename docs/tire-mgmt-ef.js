// tire-mgmt-ef.js
// EAM Extensibility Framework bootstrap for Tire Management Angular module
//
// This file is loaded by EAM when the TIREMGMT screen is opened.
// It hooks into EAM's component lifecycle and embeds the Angular app via iframe.
//
// DEPLOYMENT: Upload this file to your server and register in EAM Admin:
//   - Screen Code: TIREMGMT
//   - Extensible Framework JS: EAM.custom.external_TIREMGMT

var Ext = Ext || {};

(function () {
  // =========================================================================
  // CONFIGURATION — UPDATE THESE VALUES FOR YOUR ENVIRONMENT
  // =========================================================================
  // URL where the Angular app is served
  var APP_URL = 'http://localhost:4203';
  // =========================================================================

  // Polyfill for Ext.isEmpty if not available in this EAM version
  if (typeof Ext.isEmpty !== 'function') {
    Ext.isEmpty = function (value) {
      return (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      );
    };
  }

  // Namespace for the EF component (must match the registered name in EAM)
  var NAMESPACE = 'EAM.custom.external_TIREMGMT';

  // Flag to prevent double initialization
  var initialized = false;

  // Container ID for the iframe
  var CONTAINER_ID = 'tire-mgmt-iframe-container';
  var IFRAME_ID = 'tire-mgmt-iframe';

  // -------------------------------------------------------------------------
  // Helper: Load a script if not already loaded (singleton pattern)
  // -------------------------------------------------------------------------
  function loadScript(src, onLoad, onError) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      console.log('[EF] Script already loaded: ' + src);
      if (onLoad) onLoad();
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = onLoad || function () {};
    script.onerror =
      onError ||
      function (e) {
        console.error('[EF] Failed to load script: ' + src, e);
      };
    document.head.appendChild(script);
    console.log('[EF] Loading script: ' + src);
  }

  // -------------------------------------------------------------------------
  // Helper: Load CSS if not already loaded
  // -------------------------------------------------------------------------
  function loadCSS(href, onLoad) {
    var existing = document.querySelector('link[href="' + href + '"]');
    if (existing) {
      console.log('[EF] CSS already loaded: ' + href);
      if (onLoad) onLoad();
      return;
    }

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = onLoad || function () {};
    document.head.appendChild(link);
    console.log('[EF] Loading CSS: ' + href);
  }

  // -------------------------------------------------------------------------
  // Helper: Get or create container element
  // -------------------------------------------------------------------------
  function getOrCreateContainer() {
    var container = document.getElementById(CONTAINER_ID);
    if (container) {
      return container;
    }

    container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '500px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    return container;
  }

  // -------------------------------------------------------------------------
  // Helper: Create iframe with Angular app
  // -------------------------------------------------------------------------
  function buildIframeSrc() {
    var eamid = '';
    var tenant = '';
    var lang = '';
    var sysfunc = '';

    try {
      if (EAM && EAM.SessionStorage) {
        eamid = EAM.SessionStorage.getEamId() || '';
        tenant = EAM.SessionStorage.getTenant() || '';
      }
      if (EAM && EAM.AppData) {
        lang = EAM.AppData.getLanguage() || '';
      }
      if (EAM && EAM.Viewport && EAM.Viewport.getSystemFunction) {
        sysfunc = EAM.Viewport.getSystemFunction() || '';
      }
    } catch (e) {
      console.warn('[EF] Error reading EAM session data:', e);
    }

    console.log(
      '[EF] EAM Session — eamid:',
      eamid,
      'tenant:',
      tenant,
      'lang:',
      lang,
      'sysfunc:',
      sysfunc,
    );

    return (
      APP_URL +
      '?tireEamid=' +
      encodeURIComponent(eamid) +
      '&tireTenant=' +
      encodeURIComponent(tenant) +
      '&tireLang=' +
      encodeURIComponent(lang) +
      '&tireSysFunc=' +
      encodeURIComponent(sysfunc)
    );
  }

  function createIframe() {
    var iframe = document.getElementById(IFRAME_ID);
    if (iframe) {
      iframe.parentElement.removeChild(iframe);
    }

    iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = buildIframeSrc();
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.flex = '1';
    iframe.style.minHeight = '500px';

    return iframe;
  }

  // -------------------------------------------------------------------------
  // Main EF Component Definition
  // -------------------------------------------------------------------------
  Ext.define(NAMESPACE, {
    extend: 'EAM.custom.AbstractExtensibleFramework',

    /**
     * Returns selectors for hooking into EAM components.
     * This is the contract with EAM's Extensibility Framework.
     */
    getSelectors: function () {
      return {
        '[extensibleFramework] [tabName=LST]': {
          beforerender: this.onBeforeRender,
          afterrender: this.onAfterRender,
          afterlayout: this.onAfterLayout,
        },
      };
    },

    // -----------------------------------------------------------------------
    // STAGE 1: beforerender
    // -----------------------------------------------------------------------
    onBeforeRender: function (component) {
      console.log('[EF] Stage: beforerender — APP_URL: ' + APP_URL);
      console.log(
        '[EF] Component:',
        component && component.getXType ? component.getXType() : 'unknown',
      );

      if (initialized) {
        console.log('[EF] Already initialized, skipping');
        return;
      }

      try {
        var container = getOrCreateContainer();
        var iframe = createIframe();

        container.innerHTML = '';
        container.appendChild(iframe);

        var el = component.getEl();
        if (el) {
          el.appendChild(container);
          console.log('[EF] Container appended to component');
        } else {
          console.warn('[EF] Component has no getEl(), container not appended');
        }

        initialized = true;
        console.log('[EF] Initialization complete');
      } catch (error) {
        console.error('[EF] Error during initialization:', error);
      }
    },

    // -----------------------------------------------------------------------
    // STAGE 2: afterrender
    // -----------------------------------------------------------------------
    onAfterRender: function (component) {
      console.log('[EF] Stage: afterrender');

      var eamid = '';
      var tenant = '';
      try {
        if (EAM && EAM.SessionStorage) {
          eamid = EAM.SessionStorage.getEamId() || '';
          tenant = EAM.SessionStorage.getTenant() || '';
        }
      } catch (e) {}

      window.dispatchEvent(
        new CustomEvent('tire-management-mounted', {
          detail: {
            eamid: eamid,
            tenant: tenant,
            url: APP_URL,
            component: component,
          },
        }),
      );
    },

    // -----------------------------------------------------------------------
    // STAGE 3: afterlayout
    // -----------------------------------------------------------------------
    onAfterLayout: function (component) {
      console.log('[EF] Stage: afterlayout');

      var iframe = document.getElementById(IFRAME_ID);
      if (iframe) {
        try {
          iframe.style.height = '1px';
          iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
        } catch (e) {
          // Cross-origin iframe, can't access contentWindow
        }
      }
    },
  });

  // -------------------------------------------------------------------------
  // Bootstrap logging
  // -------------------------------------------------------------------------
  console.log('[EF] Tire Management EF Bootstrap loaded');
  console.log('[EF] Namespace: ' + NAMESPACE);
  console.log('[EF] App URL: ' + APP_URL);
})();
