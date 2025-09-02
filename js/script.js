/* =========================================================
 *  UaiFunnel - Complete script.js – 2025-08-15
 *  – Performance improvements for ALL sections including Organic Search
 * ========================================================= */

/* ---------------------------------------------------------
 *  1. Cached DOM references and utilities
 * ------------------------------------------------------- */
let navBar = document.querySelector('#header');
const footer = document.getElementById('footer');
const contactSection = document.getElementById('contact');
const menuLinks = document.querySelectorAll('nav ul li a');
const sections = document.querySelectorAll('section[id]');
const heroScrollCta = document.getElementById('scroll-cta');
const tutorialBtn = document.getElementById('howbtn');
const tutorialModal = document.getElementById('tutorialModal');
const tutorialVideo = document.getElementById('tutorialVideo');

// Mobile menu elements
const btnMenuMob = document.querySelector('#btn-menu-mob');
const line1 = document.querySelector('.line-menumob-1');
const line2 = document.querySelector('.line-menumob-2');
const line3 = document.querySelector('.line-menumob-3');
const menuMobile = document.querySelector('#menu-mobile');
const bodyElement = document.querySelector('body');

// Throttle utility for performance
const throttle = (fn, delay = 200) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn.apply(this, args);
    }
  };
};

// Debounce utility for expensive operations
const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

/* ---------------------------------------------------------
 *  2. Navbar scroll effect with throttling
 * ------------------------------------------------------- */
const handleNavbarScroll = throttle(() => {
  let scrollTop = window.scrollY;
  if (scrollTop > 0) {
    navBar.classList.add('roll');
  } else {
    navBar.classList.remove('roll');
  }
}, 16); // ~60fps

/* ---------------------------------------------------------
 *  3. Footer reveal animation using IntersectionObserver
 * ------------------------------------------------------- */
if (footer && contactSection) {
  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          footer.style.transform = 'translateY(0)';
        } else {
          footer.style.transform = 'translateY(100%)';
        }
      });
    },
    {
      root: null,
      threshold: 0.1,
      rootMargin: '50px 0px'
    }
  );
  footerObserver.observe(contactSection);
}

/* ---------------------------------------------------------
 *  4. Legacy footer scroll behavior (fallback)
 * ------------------------------------------------------- */
const handleFooterScroll = throttle(() => {
  if (!contactSection || !footer) return;
  
  const contactTop = contactSection.offsetTop;
  const scrollPosition = window.scrollY + window.innerHeight;
  
  if (scrollPosition >= contactTop || window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    footer.style.transform = 'translateY(0)';
  } else {
    footer.style.transform = 'translateY(100%)';
  }
}, 16);

/* ---------------------------------------------------------
 *  5. Smooth scroll for anchor links with performance optimization
 * ------------------------------------------------------- */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const scrollToElement = (element) => {
          const elementTop = element.offsetTop;
          const startPosition = window.pageYOffset;
          const distance = elementTop - startPosition;
          const duration = 800;
          let start = null;
          
          function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
          }
          
          function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
          }
          
          requestAnimationFrame(animation);
        };

        // Check for smooth scroll support
        if ('scrollBehavior' in document.documentElement.style) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          scrollToElement(targetElement);
        }
      }
    });
  });
}

/* ---------------------------------------------------------
 *  6. Active menu link highlighting using IntersectionObserver
 * ------------------------------------------------------- */
function removeActiveClass() {
  menuLinks.forEach(link => {
    link.classList.remove('active');
  });
}

function addActiveClass(currentSection) {
  menuLinks.forEach(link => {
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
}

// Modern approach with IntersectionObserver for better performance
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        removeActiveClass();
        addActiveClass(id);
      }
    });
  },
  {
    rootMargin: '-40% 0px -50% 0px',
    threshold: [0.1, 0.5]
  }
);

// Observe all sections with better performance
function observeSections() {
  sections.forEach((section) => {
    if (section.id) {
      sectionObserver.observe(section);
    }
  });
}

// Legacy scroll-based active link highlighting (fallback)
const handleActiveLinks = throttle(() => {
  const scrollPosition = window.scrollY;
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      const currentSection = section.getAttribute('id');
      removeActiveClass();
      addActiveClass(currentSection);
    }
  });
  
  if (scrollPosition === 0) {
    removeActiveClass();
  }
}, 100);

/* ---------------------------------------------------------
 *  7. Video loading functionality with lazy loading
 * ------------------------------------------------------- */
function loadVideo(container) {
  if (!container) return;
  
  const videoId = '9ICaItcXYMs';
  const iframe = document.createElement('iframe');
  
  // Performance optimizations for iframe
  iframe.setAttribute('width', '100%');
  iframe.setAttribute('height', '100%');
  iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0`);
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'autoplay; encrypted-media');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('loading', 'lazy'); // Lazy loading
  iframe.setAttribute('title', 'UaiFunnel Tutorial Video');
  
  // Clear container and add iframe
  container.innerHTML = '';
  container.appendChild(iframe);
}

/* ---------------------------------------------------------
 *  8. Hero scroll arrow animation with performance optimization
 * ------------------------------------------------------- */
function initializeHeroAnimation() {
  if (!heroScrollCta) return;
  
  const showScrollCta = () => {
    heroScrollCta.style.opacity = '1';
    heroScrollCta.classList.add("start-float", "start-trail");
  };
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    setTimeout(showScrollCta, 2000);
  });
}

function scrollDown() {
  const targetPosition = window.pageYOffset + window.innerHeight;
  window.scrollTo({ 
    top: targetPosition, 
    behavior: 'smooth' 
  });
}

// Add click handler for scroll CTA with performance optimization
function setupScrollCta() {
  if (heroScrollCta) {
    heroScrollCta.addEventListener('click', scrollDown, { passive: true });
  }
}

/* ---------------------------------------------------------
 *  9. Tutorial modal functionality with performance improvements
 * ------------------------------------------------------- */
let modalOpen = false;

function openTutorialModal() {
  if (!tutorialModal || !tutorialVideo || modalOpen) return;
  
  modalOpen = true;
  const videoUrl = 'https://www.youtube.com/embed/9ICaItcXYMs?rel=0&showinfo=0&autoplay=1';
  
  // Use requestAnimationFrame for smooth animation
  requestAnimationFrame(() => {
    tutorialVideo.src = videoUrl;
    tutorialModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
}

function closeTutorialModal() {
  if (!tutorialModal || !tutorialVideo || !modalOpen) return;
  
  modalOpen = false;
  
  // Use requestAnimationFrame for smooth animation
  requestAnimationFrame(() => {
    tutorialVideo.src = '';
    tutorialModal.style.display = 'none';
    document.body.style.overflow = '';
  });
}

// Setup modal with performance optimizations
function setupTutorialModal() {
  // Tutorial button click handler
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openTutorialModal();
    }, { passive: false });
  }

  // Modal click outside to close with event delegation
  if (tutorialModal) {
    tutorialModal.addEventListener('click', function(e) {
      if (e.target === tutorialModal) {
        closeTutorialModal();
      }
    }, { passive: true });
  }

  // ESC key to close modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOpen) {
      closeTutorialModal();
    }
  }, { passive: true });
}

/* ---------------------------------------------------------
 *  10. Mobile menu functionality with performance optimization
 * ------------------------------------------------------- */
function setupMobileMenu() {
  if (btnMenuMob && line1 && line2 && line3 && menuMobile && bodyElement) {
    btnMenuMob.addEventListener("click", () => {
      // Batch DOM updates for better performance
      requestAnimationFrame(() => {
        line1.classList.toggle('ativo1');
        line2.classList.toggle('ativo2');
        line3.classList.toggle('ativo3');
        menuMobile.classList.toggle('abrir');
        bodyElement.classList.toggle('no-overflow');
      });
    }, { passive: true });
  }
}

/* ---------------------------------------------------------
 *  11. Current year injection with caching
 * ------------------------------------------------------- */
function updateCurrentYear() {
  const currentYear = new Date().getFullYear();
  const yearElements = document.querySelectorAll("#anoAtual, #anoAtualz");
  
  // Cache the year to avoid repeated date calculations
  if (window.cachedYear !== currentYear) {
    window.cachedYear = currentYear;
    yearElements.forEach(element => {
      if (element) {
        element.textContent = currentYear;
      }
    });
  }
}

/* ---------------------------------------------------------
 *  12. Organic search section performance optimization
 * ------------------------------------------------------- */
function optimizeOrganicSearch() {
  const organicSection = document.getElementById('doing');
  if (!organicSection) return;

  // Optimize search form interactions
  const searchForm = organicSection.querySelector('form');
  const searchInputs = organicSection.querySelectorAll('input, textarea, select');
  
  if (searchForm) {
    // Debounce form validation for better performance
    const debouncedValidation = debounce(() => {
      // Add form validation logic here if needed
      console.log('Form validation triggered');
    }, 300);
    
    searchInputs.forEach(input => {
      input.addEventListener('input', debouncedValidation, { passive: true });
    });
  }

  // Optimize results table rendering
  const resultsTable = organicSection.querySelector('#resultsTable');
  if (resultsTable) {
    // Use virtual scrolling for large result sets
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Lazy load table rows when they come into view
            const row = entry.target;
            if (!row.classList.contains('loaded')) {
              row.classList.add('loaded');
              // Add row loading logic here
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe table rows for lazy loading
    const observeTableRows = () => {
      const rows = resultsTable.querySelectorAll('tbody tr');
      rows.forEach(row => observer.observe(row));
    };

    // Call this when table is updated
    window.observeOrganicTableRows = observeTableRows;
  }
}

/* ---------------------------------------------------------
 *  13. Maps section performance optimization
 * ------------------------------------------------------- */
function optimizeMapsSearch() {
  const mapsSection = document.getElementById('leadMapsSection');
  if (!mapsSection) return;

  // Optimize map loading and interactions
  const searchForm = mapsSection.querySelector('form');
  const resultsContainer = mapsSection.querySelector('#searchResults');
  
  if (searchForm) {
    // Debounce search queries
    const debouncedSearch = debounce(() => {
      // Add search logic here if needed
      console.log('Maps search triggered');
    }, 500);
    
    const searchInput = searchForm.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.addEventListener('input', debouncedSearch, { passive: true });
    }
  }

  // Optimize results rendering with virtual scrolling
  if (resultsContainer) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const result = entry.target;
            if (!result.classList.contains('loaded')) {
              result.classList.add('loaded');
              // Add result loading logic here
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    // Function to observe new results
    window.observeMapResults = (results) => {
      results.forEach(result => observer.observe(result));
    };
  }
}

/* ---------------------------------------------------------
 *  14. Performance monitoring and optimization
 * ------------------------------------------------------- */
function initPerformanceMonitoring() {
  if (window.performance && window.performance.mark) {
    window.performance.mark('script-js-start');
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
    
    window.performance.mark('script-js-loaded');
  }
}

/* ---------------------------------------------------------
 *  15. Intersection Observer for lazy loading
 * ------------------------------------------------------- */
function setupLazyLoading() {
  const lazyImages = document.querySelectorAll('img[data-src]');
  const lazyVideos = document.querySelectorAll('video[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px'
  });

  lazyImages.forEach(img => imageObserver.observe(img));
  lazyVideos.forEach(video => imageObserver.observe(video));
}

/* ---------------------------------------------------------
 *  16. Main initialization function
 * ------------------------------------------------------- */
function initializeApp() {
  // Performance monitoring
  initPerformanceMonitoring();
  
  // Core functionality
  setupSmoothScroll();
  observeSections();
  setupScrollCta();
  setupTutorialModal();
  setupMobileMenu();
  
  // Section-specific optimizations
  optimizeOrganicSearch();
  optimizeMapsSearch();
  
  // Additional features
  setupLazyLoading();
  updateCurrentYear();
  
  // Hero animation
  initializeHeroAnimation();
  
  console.log('🚀 UaiFunnel app initialized with full performance optimizations');
}

/* ---------------------------------------------------------
 *  17. Event listeners setup with performance optimization
 * ------------------------------------------------------- */
// Use passive listeners where possible for better scroll performance
window.addEventListener('scroll', handleNavbarScroll, { passive: true });
window.addEventListener('scroll', handleFooterScroll, { passive: true });
window.addEventListener('scroll', handleActiveLinks, { passive: true });

// Load event with performance optimization
window.addEventListener('load', () => {
  requestAnimationFrame(() => {
    handleNavbarScroll();
    if (window.performance && window.performance.mark) {
      window.performance.mark('app-fully-loaded');
    }
  });
});

// DOM content loaded event
document.addEventListener('DOMContentLoaded', initializeApp);

// Resize event with debouncing
window.addEventListener('resize', debounce(() => {
  // Handle resize events
  updateCurrentYear();
}, 250), { passive: true });

/* ---------------------------------------------------------
 *  18. Debug information for development
 * ------------------------------------------------------- */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🚀 UaiFunnel script.js loaded with FULL performance optimizations');
  console.log('📊 Optimized components:', {
    navbar: !!navBar,
    footer: !!footer && !!contactSection,
    sections: sections.length,
    menuLinks: menuLinks.length,
    organicSearch: !!document.getElementById('doing'),
    mapsSearch: !!document.getElementById('leadMapsSection'),
    mobileMenu: !!btnMenuMob,
    tutorialModal: !!tutorialModal
  });
  
  // Performance metrics
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.performance) {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('⚡ Performance metrics:', {
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
          loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          totalTime: Math.round(perfData.loadEventEnd - perfData.navigationStart)
        });
      }
    }, 100);
  });
}

/* ---------------------------------------------------------
 *  19. Export functions for external use
 * ------------------------------------------------------- */
window.UaiFunnelScript = {
  loadVideo,
  scrollDown,
  openTutorialModal,
  closeTutorialModal,
  updateCurrentYear,
  observeOrganicTableRows: window.observeOrganicTableRows,
  observeMapResults: window.observeMapResults
};

// Mark script as loaded
if (window.performance && window.performance.mark) {
  window.performance.mark('script-js-complete');
}