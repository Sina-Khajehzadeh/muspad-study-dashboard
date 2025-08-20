/**
 * Plotly Responsive Charts - Shared responsiveness utilities
 * Handles ResizeObserver + debounced Plotly.Plots.resize for all dashboard pages
 */

(function() {
  'use strict';

  // Global namespace for responsive utilities
  window.PlotlyResponsive = {
    resizeObserver: null,
    cleanupCallbacks: [],
    
    /**
     * Initialize responsive behavior for Plotly charts
     */
    init: function() {
      if (!window.ResizeObserver || this.resizeObserver) {
        return; // Already initialized or not supported
      }

      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const plotElement = entry.target;
          
          // Check if this is a plot element that contains a Plotly chart
          if (plotElement.classList.contains('plot') && plotElement.children.length > 0) {
            // Debounce the resize to avoid excessive redraws
            clearTimeout(plotElement._resizeTimeout);
            plotElement._resizeTimeout = setTimeout(() => {
              try {
                // Remove fixed width/height and set autosize
                this.ensureAutosize(plotElement);
                Plotly.Plots.resize(plotElement);
              } catch (e) {
                console.warn('Error resizing Plotly chart:', e);
              }
            }, 100);
          }
        });
      });

      // Store globally for access
      this.resizeObserver = resizeObserver;
      window.plotlyResizeObserver = resizeObserver; // Backward compatibility

      // Observe all existing plot elements
      this.observeExistingPlots();

      // Add window resize listener
      const windowResizeHandler = this.debounce(() => {
        this.resizeAllPlots();
        this.triggerPlotViewerResize();
      }, 150);

      window.addEventListener('resize', windowResizeHandler);
      this.cleanupCallbacks.push(() => window.removeEventListener('resize', windowResizeHandler));

      // Add custom pane:resized event listener
      const paneResizeHandler = () => {
        this.resizeAllPlots();
        this.triggerPlotViewerResize();
      };

      window.addEventListener('pane:resized', paneResizeHandler);
      this.cleanupCallbacks.push(() => window.removeEventListener('pane:resized', paneResizeHandler));

      return resizeObserver;
    },

    /**
     * Observe all existing plot elements
     */
    observeExistingPlots: function() {
      if (!this.resizeObserver) return;
      
      document.querySelectorAll('.plot').forEach(plotEl => {
        this.resizeObserver.observe(plotEl);
      });
    },

    /**
     * Observe a new plot element
     */
    observeNewPlot: function(plotElement) {
      if (this.resizeObserver && plotElement && plotElement.classList.contains('plot')) {
        this.resizeObserver.observe(plotElement);
      }
    },

    /**
     * Resize all Plotly charts on the page
     */
    resizeAllPlots: function() {
      document.querySelectorAll('.plot').forEach(plotEl => {
        if (plotEl.children.length > 0) {
          try {
            this.ensureAutosize(plotEl);
            Plotly.Plots.resize(plotEl);
          } catch (e) {
            console.warn('Error resizing Plotly chart on window resize:', e);
          }
        }
      });
    },

    /**
     * Trigger Plot Viewer resize if present
     */
    triggerPlotViewerResize: function() {
      const wrapper = document.getElementById('plotViewerResponsiveWrapper');
      if (wrapper && wrapper._updateScale) {
        wrapper._updateScale();
      }
    },

    /**
     * Ensure a plot has autosize enabled and no fixed dimensions
     */
    ensureAutosize: function(plotElement) {
      if (!plotElement || !plotElement.layout) return;
      
      const layout = plotElement.layout;
      
      // Remove fixed width/height if they exist
      if (layout.width) delete layout.width;
      if (layout.height) delete layout.height;
      
      // Ensure autosize is enabled
      layout.autosize = true;
    },

    /**
     * Inject responsive assets into an iframe document
     */
    injectIntoIframe: function(iframeElement) {
      try {
        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
        if (!iframeDoc) return;

        // Wait for iframe document to be fully loaded
        const injectAssets = () => {
          // Inject responsive CSS
          const cssLink = iframeDoc.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = './assets/responsive-charts.css';
          iframeDoc.head.appendChild(cssLink);

          // Inject this responsive JS directly instead of loading as external file
          const script = iframeDoc.createElement('script');
          script.textContent = `
            // Minimal responsive behavior for iframe content
            (function() {
              if (!window.ResizeObserver || !window.Plotly) return;
              
              const resizeObserver = new ResizeObserver(() => {
                // Find all Plotly graphs and resize them
                document.querySelectorAll('.plotly-graph-div').forEach(plotEl => {
                  try {
                    // Remove fixed dimensions and enable autosize
                    if (plotEl._fullLayout) {
                      delete plotEl._fullLayout.width;
                      delete plotEl._fullLayout.height;
                      plotEl._fullLayout.autosize = true;
                    }
                    window.Plotly.Plots.resize(plotEl);
                  } catch (e) {
                    console.warn('Error resizing iframe plot:', e);
                  }
                });
              });
              
              // Observe the body for size changes
              resizeObserver.observe(document.body);
              
              // Also listen for parent window resize
              const handleParentResize = () => {
                document.querySelectorAll('.plotly-graph-div').forEach(plotEl => {
                  try {
                    if (plotEl._fullLayout) {
                      delete plotEl._fullLayout.width;
                      delete plotEl._fullLayout.height;
                      plotEl._fullLayout.autosize = true;
                    }
                    window.Plotly.Plots.resize(plotEl);
                  } catch (e) {
                    console.warn('Error resizing iframe plot on parent resize:', e);
                  }
                });
              };
              
              window.addEventListener('resize', handleParentResize);
            })();
          `;
          iframeDoc.head.appendChild(script);
        };

        // If document is already loaded, inject immediately
        if (iframeDoc.readyState === 'complete') {
          injectAssets();
        } else {
          // Wait for document to load
          iframeDoc.addEventListener('DOMContentLoaded', injectAssets);
          iframeElement.addEventListener('load', injectAssets);
        }

        // Add resize listeners for iframe from parent window
        const parentWindow = window;
        const resizeHandler = this.debounce(() => {
          try {
            const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow.document;
            if (iframeDoc && iframeDoc.defaultView && iframeDoc.defaultView.Plotly) {
              iframeDoc.querySelectorAll('.plotly-graph-div').forEach(plotEl => {
                try {
                  iframeDoc.defaultView.Plotly.Plots.resize(plotEl);
                } catch (e) {
                  console.warn('Error resizing iframe plot from parent:', e);
                }
              });
            }
          } catch (e) {
            console.warn('Error accessing iframe for resize:', e);
          }
        }, 150);

        parentWindow.addEventListener('resize', resizeHandler);
        parentWindow.addEventListener('pane:resized', resizeHandler);

        // Store cleanup for iframe
        if (!iframeElement._responsiveCleanup) {
          iframeElement._responsiveCleanup = () => {
            parentWindow.removeEventListener('resize', resizeHandler);
            parentWindow.removeEventListener('pane:resized', resizeHandler);
          };
        }

      } catch (e) {
        console.warn('Error injecting responsive assets into iframe:', e);
      }
    },

    /**
     * Debounce utility
     */
    debounce: function(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Clean up all event listeners and observers
     */
    cleanup: function() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      this.cleanupCallbacks.forEach(callback => callback());
      this.cleanupCallbacks = [];
      
      window.plotlyResizeObserver = null;
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Small delay to ensure Plotly and charts are ready
      setTimeout(() => window.PlotlyResponsive.init(), 500);
    });
  } else {
    // DOM already loaded
    setTimeout(() => window.PlotlyResponsive.init(), 500);
  }

})();