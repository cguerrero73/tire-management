// tire-mgmt-ef.js
// EAM Extensibility Framework bootstrap for Tire Management Angular module
//
// This file is loaded by EAM when the TIREMGMT screen is opened.
// It hooks into EAM's component lifecycle and embeds the Angular app via iframe.
//
// DEPLOYMENT: Upload this file to your server and register in EAM Admin:
//   - Screen Code: TIREMGMT
//   - Extensible Framework JS: EAM.custom.external_TIREMGMT

// var Ext = Ext || {};


  // =========================================================================
  // CONFIGURATION — UPDATE THESE VALUES FOR YOUR ENVIRONMENT
  // =========================================================================
  // URL where the Angular app is served
  APP_URL = 'http://localhost:4201';

  // Tenant identifier (must match a config in /configs/{tenant}/config.json)
  TENANT_ID = 'default';

  // Config base path (where config JSON files are served from)
  CONFIG_BASE_PATH = APP_URL + '/configs';
  // =========================================================================

  // Namespace for the EF component (must match the registered name in EAM)
  NAMESPACE = 'EAM.custom.external_1UTEST';

  // Flag to prevent double initialization
  initialized = false;

  // Container ID for the iframe
  CONTAINER_ID = 'tire-mgmt-iframe-container';
  IFRAME_ID = 'tire-mgmt-iframe';

  // -------------------------------------------------------------------------
  // Helper: Load a script if not already loaded (singleton pattern)
  // -------------------------------------------------------------------------
  function loadScript(src, onLoad, onError) {
    // Check if already loaded
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
    // Check if already loaded
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
      if (EAM && EAM.Utils && EAM.Utils.getScreen) {
        sysfunc = EAM.Utils.getScreen().getUserFunction() || '';
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

    // Allow sandbox if needed
    // iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';

    return iframe;
  }



    // -----------------------------------------------------------------------
    // STAGE 1: beforerender
    // Called before the EAM component renders.
    // Use for: loading resources, fetching initial data
    // -----------------------------------------------------------------------
  function onBeforeRender1 () {
      console.log('[EF] Stage: beforerender — APP_URL: ' + APP_URL);
   
      // Prevent double initialization
      if (initialized) {
        console.log('[EF] Already initialized, skipping');
        return;
      }

      try {
        // Create the container and iframe
        var container = getOrCreateContainer();
        var iframe = createIframe();

        // Clear any existing content and add iframe
        container.innerHTML = '';
        container.appendChild(iframe);

        var el = Ext.ComponentQuery.query('uxtabpanel')[0].up().body.dom;
        Ext.ComponentQuery.query('uxtabpanel')[0].el.dom.style.height = "0px"; 
        // Append container to EAM component
        // var el = component.getEl();
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
    }


    // -----------------------------------------------------------------------
    // STAGE 2: afterrender
    // Called after the EAM component renders.
    // Use for: DOM manipulations, event binding on existing elements
    // -----------------------------------------------------------------------
    function onAfterRender1 () {
      console.log('[EF] Stage: afterrender');

      // Notify Angular app that it's been mounted
      window.dispatchEvent(
        new CustomEvent('tire-management-mounted', {
          detail: {
            tenant: TENANT_ID,
            url: APP_URL,
            component: 'component',
          },
        }),
      );
    };

    // -----------------------------------------------------------------------
    // STAGE 3: afterlayout
    // Called after EAM finishes layout calculations.
    // Use for: size adjustments, final positioning
    // -----------------------------------------------------------------------
    function onAfterLayout1 () {
      console.log('[EF] Stage: afterlayout');

      // Trigger resize event for the iframe (helps responsive content)
      var iframe = document.getElementById(IFRAME_ID);
      if (iframe) {
        // Some EAM components need this to properly size
        try {
          iframe.style.height = '1px';
          iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
        } catch (e) {
          // Cross-origin iframe, can't access contentWindow
        }
      }
    }
  
  
  
    function changeDisplaying() {
    try {
        Ext.ComponentQuery.query('uxtabpanel')[0].el.dom.style.height = "0px";
        var referencenode = Ext.ComponentQuery.query('uxtabpanel')[0].up().body.dom;
        vWidth = referencenode.clientWidth;
        vHeigh = referencenode.clientHeight;
        Ext.ComponentQuery.query('[uftId=resetrec]')[0].enable();
        Ext.ComponentQuery.query('[uftId=enterdesigner]')[0].disable();
        Ext.ComponentQuery.query('[uftId=epak]')[0].disable();
        Ext.ComponentQuery.query('[uftId=help]')[0].disable();
    } catch (err) { console.log(err) };
    // remove custom-div
    var vCustomDiv = document.getElementById('custom-div');
    if (vCustomDiv) { vCustomDiv.parentElement.removeChild(vCustomDiv); };
    // create custom-div
    var node = document.createElement("div");
    node.id = 'custom-div';
    node.style.width = '100%';
    node.style.height = '100%';
    referencenode.appendChild(node);

    var myhtml = [
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '<meta name="viewport" content="initial-scale=1.0, user-scalable=no">',
        '<meta charset="utf-8">',
        '<meta http-equiv="Pragma" content="no-cache" />',
        '<meta http-equiv="Expires" content="-1" />',
        '<meta http-equiv="Cache-Control" content="no-cache" />',
        '<title>OpenLayers map</title>',
        '<style>',
        '.map {',
        'height: 100%;',
        'width: 100%;',
        '}',
        '.ol-popup {',
        'position: absolute;',
        'background-color: white;',
        //        '-webkit-filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));',
        //        'filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));',
        'padding: 15px;',
        'border-radius: 10px;',
        'border: 1px solid #cccccc;',
        'bottom: 12px;',
        'left: -50px;',
        'min-width: 280px;',
        '}',
        '.ol-popup:after, .ol-popup:before {',
        'top: 100%;',
        'border: solid transparent;',
        'content: " ";',
        'height: 0;',
        'width: 0;',
        'position: absolute;',
        'pointer-events: none;',
        '}',
        '.ol-popup:after {',
        'border-top-color: white;',
        'border-width: 10px;',
        'left: 48px;',
        'margin-left: -10px;',
        '}',
        '.ol-popup:before {',
        'border-top-color: #cccccc;',
        'border-width: 11px;',
        'left: 48px;',
        'margin-left: -11px;',
        '}',
        '.ol-popup-closer {',
        'text-decoration: none;',
        'position: absolute;',
        'top: 2px;',
        'right: 8px;',
        '}',
        '.ol-popup-closer:after {',
        'content: "✖";',
        '}',
        '</style>',
        '</head>',
        '<body>',
        '<div id="map" class="map"></div>',
        '<div id="popup" class="ol-popup">',
        '<a href="#" id="popup-closer" class="ol-popup-closer"></a>',
        '<div id="popup-content"></div>',
        '</div>',
        '<div id="myLocationDiv"></div>',
        '<div id="mySearchDiv"></div>',
        '<div id="myButtonDiv"></div>',
        '<select id="TileLayer">',
        '<option value="Maptiler">Map Tiler</option>',
        '<option value="OSM">OSM</option>',
        '<option value="ESRI">ESRI</option>',
        '</select>',
        '<div id="myLegend"></div>',
        '</body>',
        '</html>',
    ].join('');
    document.getElementById('custom-div').innerHTML = myhtml;
    var searchcell = document.createElement("input");
    searchcell.type = "text";
    searchcell.id = "mySearchInput";
    searchcell.placeholder = vSearchLabel;
    searchcell.style.width = "500px";
    mySearchDiv.appendChild(searchcell);
};// end changeDisplaying


  // -------------------------------------------------------------------------
  // Main EF Component Definition
  // -------------------------------------------------------------------------
  Ext.define('EAM.custom.external_1UTEST', {
    extend: 'EAM.custom.AbstractExtensibleFramework',

    /**
     * Returns selectors for hooking into EAM components.
     * This is the contract with EAM's Extensibility Framework.
     *
     * Format: { 'CSS selector': { event: handler } }
     *
     * Common EAM selectors:
     *   [extensibleFramework]         - Any component with extensible framework
     *   [extensibleFramework] [tabName=X] - Component with specific tab
     *   [ref=someRef]                  - Specific component by reference
     */
    getSelectors: function () {
      return {
        // Hook into the list view (LST tab) of any extensible component
        '[extensibleFramework] [tabName=LST]': {
          beforerender: function () {
            onBeforeRender1();
          },
          afterrender: function () {
            onAfterRender1();
          },

          afterlayout: function () {
            onAfterLayout1();
          }
        },
      };
    }
  });
