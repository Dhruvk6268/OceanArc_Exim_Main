function bindHeaderInteractions() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav && !navToggle.dataset.bound) {
    navToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
      const icon = this.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
    navToggle.dataset.bound = '1';
  }

  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('a');
    if (toggle && !toggle.dataset.bound) {
      toggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          dropdown.classList.toggle('active');

          // Close other open dropdowns
          document.querySelectorAll('.dropdown').forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove('active');
            }
          });
        }
      });
      toggle.dataset.bound = '1';
    }
  });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (window.innerWidth <= 768) {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  }
});

document.addEventListener('layout:ready', bindHeaderInteractions);
  // After load, drop the flag so nothing else is affected
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.documentElement.classList.remove('page-anim');
    }, 850); // slightly longer than 0.8s animation
  });

function runWhenVisible(target, callback, rootMargin = '240px 0px') {
    if (!target || typeof callback !== 'function') return;

    if (!('IntersectionObserver' in window)) {
        callback();
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                obs.unobserve(entry.target);
                callback();
            }
        });
    }, { rootMargin, threshold: 0.01 });

    observer.observe(target);
}

function lazyLoadDeferredMedia(root = document) {
    const deferredVideos = Array.from(root.querySelectorAll('video[data-src]'))
        .filter(video => !video.closest('#slider'));
    const deferredImages = Array.from(root.querySelectorAll('img[data-src]'));

    const loadVideo = (video) => {
        if (!video || video.dataset.lazyLoaded === '1') return;

        const src = video.getAttribute('data-src');
        if (src) {
            video.src = src;
            video.removeAttribute('data-src');
            video.dataset.lazyLoaded = '1';
            video.load();
            return;
        }

        const deferredSource = video.querySelector('source[data-src]');
        if (deferredSource) {
            deferredSource.src = deferredSource.getAttribute('data-src');
            deferredSource.removeAttribute('data-src');
            video.dataset.lazyLoaded = '1';
            video.load();
        }
    };

    const loadImage = (img) => {
        if (!img || img.dataset.lazyLoaded === '1') return;
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.dataset.lazyLoaded = '1';
        }
    };

    const observeLazyElements = (elements, loader) => {
        if (!elements.length) return;

        if (!('IntersectionObserver' in window)) {
            elements.forEach(loader);
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                loader(entry.target);
                obs.unobserve(entry.target);
            });
        }, { rootMargin: '240px 0px', threshold: 0.01 });

        elements.forEach(element => {
            if (element.dataset.lazyObserved === '1') return;
            element.dataset.lazyObserved = '1';
            observer.observe(element);
        });
    };

    observeLazyElements(deferredVideos, loadVideo);
    observeLazyElements(deferredImages, loadImage);
}

function optimizeAutoplayVideos(root = document) {
    const videos = Array.from(root.querySelectorAll('video[autoplay]'))
        .filter(video => !video.closest('#slider'));

    if (!videos.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.2 });

    videos.forEach(video => {
        if (video.dataset.playbackObserved === '1') return;
        video.dataset.playbackObserved = '1';
        observer.observe(video);
    });
}

const PENDING_INQUIRY_KEY = 'oceanarc_pending_inquiry';

function setPendingInquiryMessage(message) {
    if (!message) return;
    try {
        sessionStorage.setItem(PENDING_INQUIRY_KEY, message);
    } catch (error) {
        // Ignore storage errors.
    }
}

function consumePendingInquiryMessage() {
    try {
        const saved = sessionStorage.getItem(PENDING_INQUIRY_KEY) || '';
        if (saved) {
            sessionStorage.removeItem(PENDING_INQUIRY_KEY);
        }
        return saved;
    } catch (error) {
        return '';
    }
}

function applyPendingInquiryToForm() {
    const messageField = document.getElementById('message');
    if (!messageField || messageField.value.trim()) return;

    let pending = '';
    try {
        const params = new URLSearchParams(window.location.search);
        pending = params.get('inquiry') || '';
        if (pending) {
            params.delete('inquiry');
            const cleanQuery = params.toString();
            const cleanUrl = window.location.pathname + (cleanQuery ? '?' + cleanQuery : '') + window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
        }
    } catch (error) {
        pending = '';
    }

    if (!pending) {
        pending = consumePendingInquiryMessage();
    }

    if (pending) {
        messageField.value = pending;
    }
}

function bindInquiryButtons() {
    if (document.body.dataset.inquiryBound === '1') return;

    document.body.addEventListener('click', function(event) {
        const cta = event.target.closest('a, button');
        if (!cta) return;

        const href = (cta.getAttribute('href') || '').trim();
        const isInlineContact = href === '#contact' || href.startsWith('#contact');
        const goesToContactPage = /(^|\/)contact\.html(?:[?#]|$)/i.test(href);

        let inquiryText = (cta.getAttribute('data-inquiry') || '').trim();
        if (!inquiryText && (isInlineContact || goesToContactPage)) {
            const label = (cta.textContent || '').toLowerCase();
            if (label.includes('quote')) {
                inquiryText = 'Hello OceanArc Exim, I want a quick export quote for bulk order. Please share MOQ, pricing, and delivery timeline.';
            }
        }

        if (!inquiryText) return;

        const messageField = document.getElementById('message');

        if (messageField && !messageField.value.trim()) {
            messageField.value = inquiryText;
        }

        if (!messageField || goesToContactPage) {
            setPendingInquiryMessage(inquiryText);
        }

        if (messageField && isInlineContact) {
            setTimeout(() => {
                messageField.focus();
            }, 450);
        }
    });

    document.body.dataset.inquiryBound = '1';
}

let analyticsPingTimer = null;
let analyticsTrackingId = 0;
let analyticsPingInFlight = false;

function sendAnalyticsPing() {
    if (analyticsPingInFlight) return;

    const pageUrl = window.location.pathname + window.location.search + window.location.hash;
    const payload = new URLSearchParams();
    payload.set('page_url', pageUrl);

    if (analyticsTrackingId > 0) {
        payload.set('tracking_id', String(analyticsTrackingId));
    }

    analyticsPingInFlight = true;
    fetch('php/track-analytics.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload.toString(),
        credentials: 'same-origin',
        keepalive: true
    })
    .then(response => {
        if (!response.ok) return null;
        return response.json().catch(() => null);
    })
    .then(data => {
        const trackingId = Number(data?.tracking_id || 0);
        if (trackingId > 0) {
            analyticsTrackingId = trackingId;
        }
    }).catch(() => {
        // Analytics errors should never block user actions.
    }).finally(() => {
        analyticsPingInFlight = false;
    });
}

function initVisitorAnalyticsTracking() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin-dashboard') || path.includes('admin-login')) return;

    analyticsTrackingId = 0;
    sendAnalyticsPing();

    if (analyticsPingTimer) {
        clearInterval(analyticsPingTimer);
    }

    analyticsPingTimer = setInterval(() => {
        if (document.visibilityState === 'visible') {
            sendAnalyticsPing();
        }
    }, 60000);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            sendAnalyticsPing();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    bindHeaderInteractions();
    bindInquiryButtons();
    applyPendingInquiryToForm();
    initVisitorAnalyticsTracking();
    lazyLoadDeferredMedia(document);
    optimizeAutoplayVideos(document);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const activeMainNav = document.getElementById('mainNav');
                const activeNavToggle = document.getElementById('navToggle');
                if (activeMainNav && activeMainNav.classList.contains('active')) {
                    activeMainNav.classList.remove('active');
                    if (activeNavToggle) {
                        const toggleIcon = activeNavToggle.querySelector('i');
                        if (toggleIcon) {
                            toggleIcon.classList.add('fa-bars');
                            toggleIcon.classList.remove('fa-times');
                        }
                    }
                }
            }
        });
    });

    const pathname = window.location.pathname.toLowerCase();
    const currentPage = pathname.substring(pathname.lastIndexOf('/') + 1);
    const isHomePage = currentPage === '' || currentPage === 'index.html';

    // Load blog posts on homepage
    const blogPostsContainer = document.getElementById('blogPosts');
    if (blogPostsContainer && isHomePage) {
        runWhenVisible(blogPostsContainer, fetchBlogPosts, '320px 0px');
    }

    // Load products on homepage
    const productsContainer = document.getElementById('productsContainer');
    if (productsContainer && isHomePage) {
        runWhenVisible(productsContainer, loadHomepageProducts, '320px 0px');
    }

    // Update the submitInquiryForm function
function submitInquiryForm(form) {
    const formData = new FormData(form);
    const formMessage = document.getElementById('formMessage');
    const submitBtn = form.querySelector('.submit-btn');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    formMessage.style.display = 'none';

    fetch('php/process-contact.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            formMessage.textContent = data.message;
            formMessage.className = 'form-message success';
            form.reset();
        } else {
            throw new Error(data.message || 'Error submitting form');
        }
    })
    .catch(error => {
        formMessage.textContent = error.message || 'An error occurred. Please try again.';
        formMessage.className = 'form-message error';
    })
    .finally(() => {
        formMessage.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Inquiry';
        
        // Hide message after 5 seconds
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    });
}

    function fetchBlogPosts() {
        fetch('php/get-blog-posts.php')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(posts => {
                if (posts.length > 0) {
                    renderBlogPosts(posts.slice(0, 3));
                } else {
                    blogPostsContainer.innerHTML = '<p class="no-content">No blog posts available yet.</p>';
                }
            })
            .catch(error => {
                console.error('Error loading blog posts:', error);
                blogPostsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load blog posts. Please try again later.</p>
                    </div>
                `;
            });
    }

  function renderBlogPosts(posts) {
    blogPostsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        
        // Use slug if available, otherwise fall back to ID
        const postUrl = post.slug ? 
            `blog-single.html?${encodeURIComponent(post.slug)}` : 
            `blog-single.html?id=${post.id}`;
        
        postElement.innerHTML = `
<a href="${postUrl}" class="learn">
   <img src="${post.image || 'images/blog-placeholder.jpg'}" alt="OceanArc Exim" loading="lazy">
    <div class="blog-content">
        <h3>${post.title}</h3>
        <p>${post.excerpt || post.content.substring(0, 150)}...</p>
        <a href="${postUrl}" class="learn-more">Read more <i class="fas fa-arrow-right"></i></a>
    </div>
</a>
        `;
        blogPostsContainer.appendChild(postElement);
    });
}

    function loadHomepageProducts() {
    fetch('php/get-products.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            if (Array.isArray(products) && products.length > 0) {
                // Limit to first 4 products only
                const limitedProducts = products.slice(0, 4);
                renderProducts(limitedProducts, productsContainer);
            } else {
                productsContainer.innerHTML = '<p class="no-content">No products available yet.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            productsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load products. Please try again later.</p>
                </div>
            `;
        });
}


function renderProducts(products, container) {
    container.innerHTML = '';
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        
        // Use slug if available, otherwise fall back to ID
        const productUrl = product.slug ? 
            `agro-single.html?${encodeURIComponent(product.slug)}` : 
            `agro-single.html?id=${product.id}`;
        
        const hasVideo = product.video && product.video.trim() !== '';
        const posterImage = product.image || 'images/product-placeholder.jpg';
        const mediaContent = hasVideo ? 
          `<video class="product-media" autoplay muted loop playsinline preload="none" data-src="${product.video}" poster="${posterImage}" style="width:100%; height:300px; object-fit:cover;">Your browser does not support the video tag.</video>` :
          `<div class="product-image" style="height:300px; background-image: url('${product.image || 'images/product-placeholder.jpg'}')"></div>`;
        
        productElement.innerHTML = `
            <a href="${productUrl}" class="learn">
                ${mediaContent}
                <div class="product-content">
                    <p>${product.title}</p>
                    <p>${product.description || product.content.substring(0, 100)}...</p>
                    <div class="learn-more">View Details <i class="fas fa-arrow-right"></i></div>
                </div>
            </a>
        `;
        container.appendChild(productElement);
    });

    lazyLoadDeferredMedia(container);
    optimizeAutoplayVideos(container);
}
});

// Fix for horizontal overflow
function fixHorizontalOverflow() {
    if (window.innerWidth < 768) {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
    }
}

// Run on load and resize
window.addEventListener('load', fixHorizontalOverflow);
window.addEventListener('resize', fixHorizontalOverflow);

// Also check for any elements causing overflow
function checkForOverflow() {
    const bodyWidth = document.body.scrollWidth;
    const viewportWidth = window.innerWidth;
    
    if (bodyWidth > viewportWidth) {
        // You can add specific fixes here if needed
    }
}
