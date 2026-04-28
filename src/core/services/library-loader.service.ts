/**
 * Library Loader Service
 *
 * Singleton pattern to load external JS/CSS libraries.
 * Prevents duplicate loading and provides wait-for-ready functionality.
 *
 * Based on the pattern found in EAM's ejemplo_de_pantalla_con_EF.js:
 * EAM.AppData.getInstallParams().get("openlayers_file_loaded")
 */

declare global {
  interface Window {
    TireManagementLoadedLibraries: Set<string>;
  }
}

/** Registry of loaded libraries */
const loadedLibraries = new Map<string, { type: 'js' | 'css'; loaded: boolean }>();

/** Callbacks waiting for a specific library */
const pendingCallbacks = new Map<string, Array<() => void>>();

/**
 * Load a JavaScript file (singleton)
 * Does not re-load if already loaded or loading
 */
export function loadScript(id: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (loadedLibraries.has(id) && loadedLibraries.get(id)?.loaded) {
      console.log(`[LibraryLoader] ${id} already loaded, skipping`);
      resolve();
      return;
    }

    // Check if currently loading
    if (loadedLibraries.has(id)) {
      console.log(`[LibraryLoader] ${id} currently loading, queuing callback`);
      const callbacks = pendingCallbacks.get(id) || [];
      callbacks.push(resolve);
      pendingCallbacks.set(id, callbacks);
      return;
    }

    // Mark as loading
    loadedLibraries.set(id, { type: 'js', loaded: false });

    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;

    script.onload = () => {
      console.log(`[LibraryLoader] ${id} loaded successfully`);
      loadedLibraries.set(id, { type: 'js', loaded: true });
      resolve();
      // Notify all pending callbacks
      const callbacks = pendingCallbacks.get(id) || [];
      callbacks.forEach((cb) => cb());
      pendingCallbacks.delete(id);
    };

    script.onerror = (error) => {
      console.error(`[LibraryLoader] Failed to load ${id} from ${url}:`, error);
      loadedLibraries.delete(id);
      reject(new Error(`Failed to load script: ${id}`));
    };

    console.log(`[LibraryLoader] Loading ${id} from ${url}`);
    document.head.appendChild(script);
  });
}

/**
 * Load a CSS file (singleton)
 */
export function loadStyle(id: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (loadedLibraries.has(id) && loadedLibraries.get(id)?.loaded) {
      console.log(`[LibraryLoader] ${id} (css) already loaded, skipping`);
      resolve();
      return;
    }

    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = url;

    link.onload = () => {
      console.log(`[LibraryLoader] ${id} (css) loaded successfully`);
      loadedLibraries.set(id, { type: 'css', loaded: true });
      resolve();
    };

    link.onerror = (error) => {
      console.error(`[LibraryLoader] Failed to load ${id} (css) from ${url}:`, error);
      reject(new Error(`Failed to load stylesheet: ${id}`));
    };

    console.log(`[LibraryLoader] Loading ${id} (css) from ${url}`);
    document.head.appendChild(link);
  });
}

/**
 * Wait for a specific library to be loaded
 */
export function waitForScript(id: string, timeout: number = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (loadedLibraries.has(id) && loadedLibraries.get(id)?.loaded) {
      resolve();
      return;
    }

    // Set timeout
    const timeoutId = setTimeout(() => {
      pendingCallbacks.delete(id);
      reject(new Error(`Timeout waiting for library: ${id}`));
    }, timeout);

    // Queue callback
    const callbacks = pendingCallbacks.get(id) || [];
    callbacks.push(() => {
      clearTimeout(timeoutId);
      resolve();
    });
    pendingCallbacks.set(id, callbacks);
  });
}

/**
 * Check if a library is loaded
 */
export function isLibraryLoaded(id: string): boolean {
  return loadedLibraries.has(id) && loadedLibraries.get(id)?.loaded === true;
}

/**
 * Get all loaded libraries
 */
export function getLoadedLibraries(): string[] {
  return Array.from(loadedLibraries.entries())
    .filter(([_, status]) => status.loaded)
    .map(([id]) => id);
}

/**
 * Reset loader state (for testing)
 */
export function resetLibraryLoader(): void {
  loadedLibraries.clear();
  pendingCallbacks.clear();
}

/**
 * LibraryLoader singleton
 */
export const LibraryLoader = {
  loadScript,
  loadStyle,
  waitForScript,
  isLibraryLoaded,
  getLoadedLibraries,
  reset: resetLibraryLoader,
};

export default LibraryLoader;
