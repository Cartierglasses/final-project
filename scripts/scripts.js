// NetSec Academy interaction scripts (light-only theme)
// Features:
// - Mobile navigation toggle (ARIA compliant)
// - Scroll reveal animations respecting prefers-reduced-motion
// - Dynamic current year in footer
// - Client-side form validation feedback

(function() {
  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  };

  onReady(() => {
    // Footer year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile nav toggle
    const navToggle = document.querySelector('.nav-toggle');
    const siteNav = document.getElementById('site-nav');
    if (navToggle && siteNav) {
      const setOpen = (open) => {
        siteNav.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) {
          siteNav.querySelector('a')?.focus();
        }
      };

      navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!siteNav.classList.contains('open'));
      });

      // Close when clicking a link
      siteNav.addEventListener('click', (e) => {
        const t = e.target;
        if (t instanceof HTMLElement && t.tagName === 'A') {
          setOpen(false);
        }
      });

      // Close when clicking outside the nav
      document.addEventListener('click', (e) => {
        if (!siteNav.contains(e.target) && e.target !== navToggle && siteNav.classList.contains('open')) {
          setOpen(false);
        }
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && siteNav.classList.contains('open')) {
          setOpen(false);
          navToggle.focus();
        }
      });

      // Reset on window resize
      window.addEventListener('resize', () => {
        if (window.matchMedia('(min-width: 901px)').matches && siteNav.classList.contains('open')) {
          setOpen(false);
        }
      });
    }

    // Scroll reveal
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const targets = Array.from(document.querySelectorAll('.reveal'));
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
      targets.forEach(el => observer.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    }

    // Form validation feedback
    const form = document.querySelector('form');
    if (form) {
      const fields = Array.from(form.querySelectorAll('input, textarea'));
      const ensureErrorEl = (field) => {
        let el = field.nextElementSibling;
        if (!(el && el.classList && el.classList.contains('field-error'))) {
          el = document.createElement('div');
          el.className = 'field-error';
          field.parentNode.insertBefore(el, field.nextSibling);
        }
        return el;
      };
      const showError = (field, msg) => {
        const err = ensureErrorEl(field);
        err.textContent = msg || '';
        err.classList.toggle('active', !!msg);
        field.classList.toggle('error', !!msg);
        field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      };
      const validators = {
        email: (f) => {
          if (!f.value) return 'Email is required.';
          return /.+@.+\..+/.test(f.value) ? '' : 'Enter a valid email.';
        },
        text: (f) => (f.required && !f.value.trim()) ? 'This field is required.' : '',
        textarea: (f) => {
          if (f.required && !f.value.trim()) return 'Message is required.';
          const min = f.getAttribute('minlength');
          if (min && f.value.trim().length < Number(min)) return `Please write at least ${min} characters.`;
          return '';
        }
      };
      const validate = (field) => {
        const type = field.tagName.toLowerCase() === 'textarea' ? 'textarea' : (field.type || 'text');
        const fn = validators[type] || validators.text;
        const msg = fn(field);
        showError(field, msg);
        return !msg;
      };
      fields.forEach(f => {
        f.addEventListener('blur', () => validate(f));
        f.addEventListener('input', () => validate(f));
      });
      form.addEventListener('submit', (e) => {
        let ok = true;
        fields.forEach(f => { if (!validate(f)) ok = false; });
        if (!ok) {
          e.preventDefault();
          form.querySelector('.error')?.focus();
        }
      });
    }

    // Sidebar scrollspy for content pages
    const contentNav = document.querySelector('.content-nav');
    if (contentNav) {
      const navLinks = Array.from(contentNav.querySelectorAll('a[href^="#"]'));
      const sections = navLinks
        .map(a => {
          const id = a.getAttribute('href').slice(1);
          const el = document.getElementById(id);
          return el ? { link: a, el } : null;
        })
        .filter(Boolean);

      const setActive = (id) => {
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      };

      if ('IntersectionObserver' in window && sections.length) {
        const spy = new IntersectionObserver((entries) => {
          // Choose the top-most visible section
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) {
            const id = visible[0].target.id;
            setActive(id);
          }
        }, {
          root: null,
          // Trigger when section crosses ~40% from top; account for sticky header via positive top margin
          rootMargin: '0px 0px -60% 0px',
          threshold: 0.1
        });

        sections.forEach(({ el }) => spy.observe(el));
      }

      // Optional: improve in-page link focus behavior
      navLinks.forEach(a => {
        a.addEventListener('click', () => {
          const id = a.getAttribute('href').slice(1);
          // Defer to let browser scroll, then set active for instant feedback
          setTimeout(() => setActive(id), 50);
        });
      });
    }

    // Sidebar overlay toggle with floating button (all screens ≥768px)
    const sidebar = document.getElementById('page-sidebar');
    
    if (sidebar && window.innerWidth >= 768) {
      // Create floating toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'btn-toggle-sidebar-fab';
      toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="7" height="16" rx="2" fill="currentColor"/><rect x="12" y="4" width="9" height="16" rx="2" fill="currentColor" opacity=".4"/></svg>';
      document.body.appendChild(toggleBtn);
      
      // Create backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-sidebar';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close sidebar');
      sidebar.insertBefore(closeBtn, sidebar.firstChild);
      
      const openSidebar = () => {
        sidebar.classList.add('open');
        backdrop.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        sidebar.querySelector('a')?.focus();
      };
      
      const closeSidebar = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggleBtn.focus();
      };
      
      toggleBtn.addEventListener('click', openSidebar);
      closeBtn.addEventListener('click', closeSidebar);
      backdrop.addEventListener('click', closeSidebar);
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
          closeSidebar();
        }
      });
      
      // Close when clicking a section link
      sidebar.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeSidebar);
      });
    }

    // Floating sections pill + overlay for small screens
    if (contentNav) {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'sections-pill';
      pill.setAttribute('aria-haspopup', 'true');
      pill.setAttribute('aria-expanded', 'false');
  const iconList = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="7" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="17" r="1.5" fill="currentColor"/><rect x="9" y="6" width="10" height="2" rx="1" fill="currentColor"/><rect x="9" y="11" width="10" height="2" rx="1" fill="currentColor"/><rect x="9" y="16" width="10" height="2" rx="1" fill="currentColor"/></svg>';
  pill.innerHTML = iconList + ' Sections';
      document.body.appendChild(pill);

      const overlay = document.createElement('div');
      overlay.className = 'sections-overlay';
      overlay.innerHTML = '<div class="sections-sheet" role="dialog" aria-modal="true" aria-label="Page sections"><button class="close-btn" aria-label="Close sections">×</button><h3>Sections</h3></div>';
      const sheet = overlay.querySelector('.sections-sheet');
      const closeBtn = overlay.querySelector('.close-btn');
      // Clone existing nav list into overlay
      const clonedNav = contentNav.querySelector('ul').cloneNode(true);
      sheet.appendChild(document.createElement('nav')).appendChild(clonedNav);
      document.body.appendChild(overlay);

      const openOverlay = () => {
        overlay.classList.add('open');
        pill.setAttribute('aria-expanded', 'true');
        // Focus first link for accessibility
        const firstLink = sheet.querySelector('a');
        firstLink && firstLink.focus();
        document.body.style.overflow = 'hidden';
      };
      const closeOverlay = () => {
        overlay.classList.remove('open');
        pill.setAttribute('aria-expanded', 'false');
        pill.focus();
        document.body.style.overflow = '';
      };

      pill.addEventListener('click', () => {
        if (overlay.classList.contains('open')) closeOverlay(); else openOverlay();
      });
      closeBtn.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeOverlay();
      });
      // Close overlay when clicking a link
      sheet.addEventListener('click', (e) => {
        const t = e.target;
        if (t instanceof HTMLElement && t.tagName === 'A') {
          closeOverlay();
        }
      });
    }

    // Back-to-top floating button visible after scroll
    // Back to top FAB (appears after scroll threshold)
    {
      const fab = document.createElement('button');
      fab.className = 'backtotop-fab';
      fab.type = 'button';
      fab.setAttribute('aria-label', 'Back to top');
      fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5l-6 6M12 5l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      document.body.appendChild(fab);
      const threshold = 480;
      let ticking = false;
      const update = () => {
        const show = window.scrollY > threshold;
        fab.classList.toggle('visible', show);
        ticking = false;
      };
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', update);
      update();
      fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Assign body theme class based on page hero variant (for active link accent)
    const hero = document.querySelector('.page-hero');
    if (hero) {
      if (hero.classList.contains('page-hero--red')) document.body.classList.add('red');
      else if (hero.classList.contains('page-hero--blue')) document.body.classList.add('blue');
      else if (hero.classList.contains('page-hero--purple')) document.body.classList.add('purple');
    }

    // Back to top enhancer (handles pages without #top anchor)
    document.querySelectorAll('a[href="#top"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  });
})();
