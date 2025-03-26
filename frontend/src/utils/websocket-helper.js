/**
 * WebSocket Helper Utility
 * Provides functions to handle WebSocket connections and reconnection
 */

export const setupWebSocketReconnection = () => {
  // This script helps reconnect to the Vite HMR WebSocket when connections fail
  let wsReconnectTimer;
  
  // Check if window and WebSocket are available (browser environment)
  if (typeof window !== 'undefined' && window.WebSocket) {
    const originalWebSocket = window.WebSocket;
    
    // Create a WebSocket wrapper with reconnection capability
    window.WebSocket = function(url, protocols) {
      const ws = new originalWebSocket(url, protocols);
      
      // Handle WebSocket open events
      ws.addEventListener('open', () => {
        // console.log('WebSocket connected successfully');
        clearTimeout(wsReconnectTimer);
      });
      
      // Handle WebSocket close events
      ws.addEventListener('close', (event) => {
        if (!event.wasClean) {
          // Disable automatic reconnection to prevent refreshes
          // console.log('WebSocket connection lost, reconnection disabled');
          // Don't automatically reconnect to prevent potential page refreshes
        }
      });
      
      // Handle WebSocket errors
      ws.addEventListener('error', (error) => {
        // console.error('WebSocket error:', error);
      });
      
      return ws;
    };
    
    // Copy over WebSocket static properties
    window.WebSocket.prototype = originalWebSocket.prototype;
    window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = originalWebSocket.OPEN;
    window.WebSocket.CLOSING = originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = originalWebSocket.CLOSED;
  }
};
