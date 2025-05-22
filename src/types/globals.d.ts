// src/types/globals.d.ts

// Extend the Window interface to include the Bootstrap property
declare global {
  interface Window {
    bootstrap?: any; // Using 'any' for simplicity, as the exact Bootstrap type might be complex
                     // or specific Bootstrap JS components can be typed out if known e.g.
                     // bootstrap?: {
                     //   Tooltip: new (element: Element, options?: any) => any;
                     //   Modal: new (element: Element, options?: any) => any;
                     //   // Add other Bootstrap components as needed
                     // };
  }
}

// This export {} is important to make this file a module, 
// which allows augmenting the global scope.
export {};
