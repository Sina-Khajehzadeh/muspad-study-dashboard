/**
 * MUSPAD Layout Bridge - Custom Dashboard Navigation & Responsive Behavior
 * Replaces AdminKit functionality with custom implementations
 */

(function() {
  'use strict';

  // ===== State Management =====
  let sidebarCollapsed = localStorage.getItem('muspad.sidebar.collapsed') === 'true';
  
  // ===== Utility Functions =====
  function $(id) {
    return document.getElementById(id);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ===== Sidebar Management =====
  function initSidebar() {
    const sidebar = $('.sidebar');
    const sidebarToggle = $('.sidebar-toggle');
    
    // Apply initial state
    if (sidebarCollapsed) {
      sidebar?.classList.add('collapsed');
    }
    
    // Toggle handler
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', function(e) {
        e.preventDefault();
        toggleSidebar();
      });
    }
    
    // Mobile: close sidebar when clicking outside
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 768) {
        const sidebar = $('.sidebar');
        if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
          sidebar.classList.remove('show');
        }
      }
    });
  }

  function toggleSidebar() {
    const sidebar = $('.sidebar');
    if (!sidebar) return;
    
    if (window.innerWidth <= 768) {
      // Mobile: toggle show/hide
      sidebar.classList.toggle('show');
    } else {
      // Desktop: toggle collapse
      sidebarCollapsed = !sidebarCollapsed;
      sidebar.classList.toggle('collapsed', sidebarCollapsed);
      localStorage.setItem('muspad.sidebar.collapsed', sidebarCollapsed.toString());
    }
  }

  // ===== Navigation Management =====
  function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav-link[data-action]');
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active from all nav items
        navItems.forEach(item => item.classList.remove('active'));
        
        // Add active to clicked item's parent
        const parentItem = this.closest('.sidebar-nav-item');
        if (parentItem) {
          parentItem.classList.add('active');
        }
        
        // Handle navigation action
        const action = this.dataset.action;
        handleNavAction(action);
        
        // Close mobile sidebar after navigation
        if (window.innerWidth <= 768) {
          const sidebar = $('.sidebar');
          if (sidebar) sidebar.classList.remove('show');
        }
      });
    });
  }

  function handleNavAction(action) {
    switch(action) {
      case 'dashboard':
        showDashboard();
        break;
      case 'filters':
        // Always use our custom toggle for consistency
        togglePanel('panelFilters');
        break;
      case 'data':
        togglePanel('panelData');
        break;
      case 'insights':
        togglePanel('panelInsights');
        break;
      case 'add-chart':
        // Trigger existing add chart functionality
        const btnAdd = $('btnAdd');
        if (btnAdd && typeof btnAdd.click === 'function') {
          btnAdd.click();
        } else if (typeof window.openModal === 'function') {
          window.openModal();
        }
        break;
      case 'settings':
        togglePanel('panelSettings');
        break;
    }
  }

  function togglePanel(panelId) {
    const panel = $(panelId);
    if (!panel) return;
    
    // Hide other panels
    const allPanels = ['panelFilters', 'panelData', 'panelInsights', 'panelSettings'];
    allPanels.forEach(id => {
      const p = $(id);
      if (p && id !== panelId) {
        p.style.display = 'none';
        p.classList.remove('active');
      }
    });
    
    // Hide KPI row and grid when showing panels
    const kpiRow = $('.kpi-row');
    const grid = $('grid');
    
    // Toggle the target panel
    const isVisible = panel.style.display === 'block' || panel.classList.contains('active');
    
    if (isVisible) {
      // Hide panel, show dashboard
      panel.style.display = 'none';
      panel.classList.remove('active');
      if (kpiRow) kpiRow.style.display = 'grid';
      if (grid) grid.style.display = 'grid';
    } else {
      // Show panel, hide dashboard
      panel.style.display = 'block';
      panel.classList.add('active');
      if (kpiRow) kpiRow.style.display = 'none';
      if (grid) grid.style.display = 'none';
    }
  }

  function showDashboard() {
    // Hide all panels
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });
    
    // Show KPI cards and chart grid
    const kpiRow = $('.kpi-row');
    const grid = $('grid');
    
    if (kpiRow) kpiRow.style.display = 'grid';
    if (grid) grid.style.display = 'grid';
    
    // Update page title if function exists
    if (typeof window.updateTitle === 'function') {
      window.updateTitle('Analytics Dashboard');
    }
    
    // Update title element directly
    const titleEl = $('title');
    if (titleEl) {
      titleEl.textContent = 'Analytics Dashboard';
    }
  }

  // ===== Chart Responsiveness =====
  function initChartResponsiveness() {
    if (!window.ResizeObserver) return;
    
    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        entries.forEach((entry) => {
          const cardElement = entry.target;
          
          // Check if this is a card with charts
          if (cardElement.classList.contains('card-chart') || 
              cardElement.querySelector('.plot')) {
            
            // Dispatch resize event for Plotly charts
            setTimeout(() => {
              const event = new CustomEvent('pane:resized', {
                bubbles: true,
                detail: { target: cardElement }
              });
              cardElement.dispatchEvent(event);
              
              // Also dispatch regular resize for compatibility
              window.dispatchEvent(new Event('resize'));
            }, 150);
          }
        });
      }, 100)
    );
    
    // Observe existing chart cards
    document.querySelectorAll('.card-chart, .chart-card').forEach(card => {
      resizeObserver.observe(card);
    });
    
    // Store observer globally for new chart cards
    window.chartResizeObserver = resizeObserver;
  }

  // ===== Search Functionality =====
  function initSearch() {
    const searchInput = $('.search-input');
    if (!searchInput) return;
    
    // Focus search with "/" key
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !e.target.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
        searchInput.focus();
      }
    });
    
    // Search functionality (placeholder for future implementation)
    searchInput.addEventListener('input', debounce(function(e) {
      const query = e.target.value.toLowerCase();
      // TODO: Implement search functionality
      console.log('Search query:', query);
    }, 300));
  }

  // ===== KPI Sync =====
  function initKPISync() {
    // Sync existing summary spans to KPI cards
    const kpiMappings = [
      { source: 'sumTotalRows', target: 'kpi-total-value' },
      { source: 'sumFilteredRows', target: 'kpi-filtered-value' },
      { source: 'sumTotalCols', target: 'kpi-columns-value' },
      { source: 'sumDateRange', target: 'kpi-range-value' }
    ];
    
    function updateKPIValues() {
      kpiMappings.forEach(({ source, target }) => {
        const sourceEl = $(source);
        const targetEl = $(target);
        
        if (sourceEl && targetEl) {
          targetEl.textContent = sourceEl.textContent;
        }
      });
    }
    
    // Initial sync
    updateKPIValues();
    
    // Watch for changes (using MutationObserver)
    const observer = new MutationObserver(updateKPIValues);
    
    kpiMappings.forEach(({ source }) => {
      const el = $(source);
      if (el) {
        observer.observe(el, { 
          childList: true, 
          characterData: true, 
          subtree: true 
        });
      }
    });
  }

  // ===== Window Resize Handler =====
  function initWindowResize() {
    const handleResize = debounce(() => {
      // Update sidebar behavior based on screen size
      const sidebar = $('.sidebar');
      if (!sidebar) return;
      
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('collapsed');
      } else {
        sidebar.classList.remove('show');
        if (sidebarCollapsed) {
          sidebar.classList.add('collapsed');
        }
      }
      
      // Trigger chart resize
      if (typeof window.PlotlyResponsive?.resizeAllPlots === 'function') {
        window.PlotlyResponsive.resizeAllPlots();
      }
    }, 250);
    
    window.addEventListener('resize', handleResize);
  }

  // ===== Theme Management =====
  function initTheme() {
    // Ensure dark theme is applied
    document.body.setAttribute('data-theme', 'dark');
    document.body.classList.add('theme-dark');
    
    // Remove any conflicting theme classes
    document.body.classList.remove('theme-light');
  }

  // ===== Accessibility Enhancements =====
  function initAccessibility() {
    // Add keyboard navigation for sidebar
    const navLinks = document.querySelectorAll('.sidebar-nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
    
    // Ensure proper ARIA labels
    const sidebar = $('.sidebar');
    if (sidebar) {
      sidebar.setAttribute('aria-label', 'Main navigation');
    }
  }

  // ===== Initialization =====
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    console.log('Initializing MUSPAD Layout Bridge...');
    
    // Initialize all components
    initTheme();
    initSidebar();
    initNavigation();
    initChartResponsiveness();
    initSearch();
    initKPISync();
    initWindowResize();
    initAccessibility();
    
    // Trigger initial KPI update after a short delay
    setTimeout(() => {
      if (typeof window.updateSummary === 'function') {
        window.updateSummary();
      }
    }, 1000);
    
    console.log('MUSPAD Layout Bridge initialized');
  }

  // ===== Export Functions =====
  window.MuspadLayout = {
    init,
    toggleSidebar,
    showDashboard,
    handleNavAction
  };

  // Auto-initialize
  init();

})();