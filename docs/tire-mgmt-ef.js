// tire-mgmt-ef.js
// EAM Extensibility Framework bootstrap for Tire Management Angular module
//
// This file is loaded by EAM when the TIREMGMT screen is opened.
// It hooks into EAM's component lifecycle and embeds the Angular app via iframe.
//
// DEPLOYMENT: Upload this file to your server and register in EAM Admin:
//   - Screen Code: TIREMGMT
//   - Extensible Framework JS: EAM.custom.external_TIREMGMT

// =========================================================================
// CONFIGURATION — UPDATE THESE VALUES FOR YOUR ENVIRONMENT
// =========================================================================
// URL where the Angular app is served
APP_URL = 'http://localhost:4201';

// Namespace for the EF component (must match the registered name in EAM)
NAMESPACE = 'EAM.custom.external_TIREMGMT';

// Flag to prevent double initialization
initialized = false;

// Container ID for the iframe
CONTAINER_ID = 'tire-mgmt-iframe-container';
IFRAME_ID = 'tire-mgmt-iframe';
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
// Helper: Build iframe src with EAM session data
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
    if (EAM && EAM.Utils && EAM.Utils.getScreen) {
      sysfunc = EAM.Utils.getScreen().getUserFunction() || '';
    }
  } catch (e) {}

  return (
    APP_URL +
    '?eamid=' +
    encodeURIComponent(eamid) +
    '&tenant=' +
    encodeURIComponent(tenant) +
    '&lang=' +
    encodeURIComponent(lang) +
    '&sysfunc=' +
    encodeURIComponent(sysfunc)
  );
}

// -------------------------------------------------------------------------
// Helper: Create iframe with Angular app
// -------------------------------------------------------------------------
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
// STAGE 1: beforerender
// -------------------------------------------------------------------------
function onBeforeRender1() {
  if (initialized) {
    return;
  }

  try {
    var container = getOrCreateContainer();
    var iframe = createIframe();

    container.innerHTML = '';
    container.appendChild(iframe);

    // Get EAM tab panel body and append container
    var el = Ext.ComponentQuery.query('uxtabpanel')[0].up().body.dom;
    Ext.ComponentQuery.query('uxtabpanel')[0].el.dom.style.height = '0px';

    if (el) {
      el.appendChild(container);
    }

    initialized = true;
  } catch (error) {}
}

// -------------------------------------------------------------------------
// STAGE 2: afterrender
// -------------------------------------------------------------------------
function onAfterRender1() {
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
      },
    }),
  );
}

// -------------------------------------------------------------------------
// STAGE 3: afterlayout
// -------------------------------------------------------------------------
function onAfterLayout1() {
  var iframe = document.getElementById(IFRAME_ID);
  if (iframe) {
    try {
      iframe.style.height = '1px';
      iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
    } catch (e) {}
  }
}

// -------------------------------------------------------------------------
// Main EF Component Definition
// -------------------------------------------------------------------------
Ext.define(NAMESPACE, {
  extend: 'EAM.custom.AbstractExtensibleFramework',

  getSelectors: function () {
    return {
      '[extensibleFramework] [tabName=LST]': {
        beforerender: function () {
          onBeforeRender1();
        },
        afterrender: function () {
          onAfterRender1();
        },
        afterlayout: function () {
          onAfterLayout1();
        },
      },
    };
  },
});
