/**
 * NYGHTO.DESIGN — Rock-Solid Kinetic Scroll & Dual-Theme Engine
 * Theme 1: #01249D (Studio Cobalt) // Theme 2: #FFEF03 (Onam Festive Gold Edition 🌸)
 * Mobile & Desktop Optimized
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initSiteCmsOverrides();
  initMobileNavigation();
  initLenisSmoothScroll();
  initVerticalScrollSlider();
  initGlitchFreeScrollPhysics();
  initInteractiveEyeTracking();
  initPaperCard3DTilt();
  initCta1FounderHotline();
  initConversationalBrief();
  initServiceInquireLinks();
  initCrosshairIntersectionTracker();
  initFaqAccordion();
});

/* ==========================================================================
   0. Mobile Navigation Drawer Handler
   ========================================================================== */
function initMobileNavigation() {
  const openBtn = document.getElementById('openMobileMenu');
  const closeBtn = document.getElementById('closeMobileMenu');
  const drawer = document.getElementById('mobileDrawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (!drawer) return;

  function openMenu() {
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
}

/* ==========================================================================
   0. Default Theme State Lock
   ========================================================================== */
function initThemeEngine() {
  document.body.classList.remove('theme-yellow');
  try {
    localStorage.removeItem('nyghto-theme');
  } catch (e) {}
}

// Interactive tactile balloon bounce audio on click
document.addEventListener('DOMContentLoaded', () => {
  const sculpture = document.getElementById('helloSculpture');
  if (sculpture) {
    sculpture.addEventListener('click', () => {
      playSynthTone(523.25);
      setTimeout(() => playSynthTone(659.25), 80);
      setTimeout(() => playSynthTone(783.99), 160);
    });
  }
});

/* ==========================================================================
   Festive Confetti Burst on Click
   ========================================================================== */
window.triggerFestiveConfetti = function() {
  playSynthTone(784);
  setTimeout(() => playSynthTone(1046.5), 100);

  const container = document.getElementById('onamPetals');
  if (!container) return;

  for (let i = 0; i < 16; i++) {
    const burstPetal = document.createElement('div');
    burstPetal.className = 'marigold-petal';
    burstPetal.style.left = `${20 + Math.random() * 60}%`;
    burstPetal.style.top = `20px`;
    burstPetal.style.animationDuration = `${3.5 + Math.random() * 3.5}s`;
    burstPetal.style.transform = `scale(${0.6 + Math.random() * 0.8}) rotate(${Math.random() * 360}deg)`;
    container.appendChild(burstPetal);

    setTimeout(() => {
      burstPetal.remove();
    }, 7000);
  }
};

/* ==========================================================================
   1. Rock-Solid Lenis Smooth Scroll Engine (Synced with GSAP)
   ========================================================================== */
let lenis;

function initLenisSmoothScroll() {
  if (typeof Lenis === 'undefined') return;

  const isMobile = window.innerWidth <= 768;

  lenis = new Lenis({
    duration: isMobile ? 1.0 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.2,
    infinite: false
  });

  const sliderThumb = document.getElementById('sliderThumb');
  const sliderTrack = document.getElementById('sliderTrack');

  lenis.on('scroll', (e) => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.update();
    }
    if (sliderThumb && sliderTrack) {
      const trackHeight = sliderTrack.offsetHeight;
      const thumbHeight = sliderThumb.offsetHeight;
      const maxTravel = trackHeight - thumbHeight;
      const travel = Math.min(maxTravel, Math.max(0, e.progress * maxTravel));
      sliderThumb.style.transform = `translateY(${travel}px)`;
    }
  });

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target && lenis) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      }
    });
  });
}

/* ==========================================================================
   Bespoke Right Vertical Scroll Slider Interaction (Click & Drag & Touch)
   ========================================================================== */
function initVerticalScrollSlider() {
  const track = document.getElementById('sliderTrack');
  const thumb = document.getElementById('sliderThumb');
  if (!track || !thumb) return;

  let isDragging = false;

  function scrubTo(clientY) {
    const rect = track.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const progress = Math.min(1, Math.max(0, offsetY / rect.height));

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = progress * maxScroll;

    if (lenis) {
      lenis.scrollTo(targetScroll, { duration: 0.4 });
    } else {
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }

  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    scrubTo(e.clientY);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    scrubTo(e.clientY);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  track.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      isDragging = true;
      scrubTo(e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length === 0) return;
    scrubTo(e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* ==========================================================================
   2. Glitch-Free Leaf-Node Parallax & Pinned Physics
   ========================================================================== */
function initGlitchFreeScrollPhysics() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const isMobile = window.innerWidth <= 768;

  // 1. Grid Background Parallax Drift
  gsap.to('.crosshair-grid-bg', {
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5
    },
    y: -50,
    ease: 'none'
  });

  // 2. Hero Centerpiece Parallax & Stickers
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.hero-stage',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.5
    }
  });

  heroTl
    .to('#helloSculptureWrap', { y: isMobile ? -30 : -85, scale: 0.92, opacity: 0.35, ease: 'none' }, 0)
    .to('.sticker-heart', { y: isMobile ? -40 : -160, rotate: 20, ease: 'none' }, 0)
    .to('.sticker-onam-pookkalam', { y: isMobile ? -40 : -140, rotate: 180, ease: 'none' }, 0)
    .to('.sticker-kathakali', { y: isMobile ? -40 : -180, rotate: -15, ease: 'none' }, 0)
    .to('.sticker-olakkuda', { y: isMobile ? -30 : -150, rotate: 20, ease: 'none' }, 0)
    .to('.sticker-vallam', { y: isMobile ? -30 : -100, x: isMobile ? 15 : 40, ease: 'none' }, 0)
    .to('.sticker-eyes', { y: isMobile ? -30 : -120, x: isMobile ? -15 : -40, ease: 'none' }, 0)
    .to('.sticker-cursor', { y: isMobile ? -35 : -140, x: isMobile ? 20 : 50, rotate: 18, ease: 'none' }, 0)
    .to('.hero-info-grid', { y: -25, opacity: 0.4, ease: 'none' }, 0)
    .to('.word-split-hero:nth-child(1)', { x: isMobile ? 0 : -30, ease: 'none' }, 0)
    .to('.word-split-hero:nth-child(2)', { x: isMobile ? 0 : 30, ease: 'none' }, 0)
    .to('.word-split-hero:nth-child(3)', { x: isMobile ? 0 : -20, ease: 'none' }, 0);

  // 2b. Initial Hero Entrance Animation
  gsap.from('.word-split-hero', {
    y: 60,
    opacity: 0,
    stagger: 0.12,
    duration: 1.0,
    ease: 'power3.out',
    delay: 0.1
  });

  gsap.from('#helloSculptureWrap', {
    scale: 0.85,
    y: 35,
    opacity: 0,
    duration: 1.2,
    ease: 'elastic.out(1, 0.75)',
    delay: 0.2
  });

  gsap.from('.mouse-magnetic-sticker', {
    scale: 0,
    opacity: 0,
    stagger: 0.08,
    duration: 0.8,
    ease: 'back.out(1.7)',
    delay: 0.4
  });

  // 3. Physical Paper Card Scrub Entrance
  const paperCard = document.getElementById('paperCard');
  if (paperCard) {
    gsap.fromTo(paperCard,
      {
        y: isMobile ? 60 : 180,
        rotate: -12,
        scale: 0.9,
        opacity: 0
      },
      {
        y: 0,
        rotate: -3.5,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.statement-section',
          start: 'top 85%',
          end: 'top 35%',
          scrub: 0.6
        }
      }
    );
  }

  // 4. Statement Copy Entrance
  gsap.fromTo('.statement-lead',
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      scrollTrigger: {
        trigger: '.statement-section',
        start: 'top 75%',
        end: 'top 40%',
        scrub: 0.6
      }
    }
  );

  gsap.fromTo('.statement-sub-wrap',
    { y: 30, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      scrollTrigger: {
        trigger: '.statement-section',
        start: 'top 68%',
        end: 'top 35%',
        scrub: 0.6
      }
    }
  );

  // 5. Bespoke Editorial Sticky Pinned Statement
  const pinnedTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#pinned-statement',
      start: 'top top',
      end: '+=100%',
      pin: true,
      scrub: 0.6
    }
  });

  pinnedTl
    .fromTo('#pinned-text', 
      { scale: 0.85, opacity: 0.2 }, 
      { scale: isMobile ? 1.0 : 1.12, opacity: 1, ease: 'power1.out' }, 0
    )
    .fromTo('.pinned-row-1', 
      { x: isMobile ? -15 : -60 }, 
      { x: isMobile ? 10 : 35, ease: 'none' }, 0
    )
    .fromTo('.pinned-row-2', 
      { scale: 0.9 }, 
      { scale: 1.05, ease: 'none' }, 0
    )
    .fromTo('.pinned-row-3', 
      { x: isMobile ? 15 : 60 }, 
      { x: isMobile ? -10 : -35, ease: 'none' }, 0
    )
    .fromTo('.pinned-reticle', 
      { opacity: 0.2 }, 
      { opacity: 0.8, ease: 'none' }, 0
    );

  // Click chime on pinned statement
  const pinnedHeadline = document.getElementById('pinned-text');
  if (pinnedHeadline) {
    pinnedHeadline.addEventListener('click', () => {
      playSynthTone(440);
      setTimeout(() => playSynthTone(554.37), 100);
      setTimeout(() => playSynthTone(659.25), 200);
    });
  }

  // 6. React Bits <ScrollStack /> Stacking Engine
  const stackCards = gsap.utils.toArray('.scroll-stack-card');
  const stackEnd = document.querySelector('.scroll-stack-end');

  if (stackCards.length && stackEnd) {
    stackCards.forEach((card, i) => {
      const isLast = i === stackCards.length - 1;
      const stackOffset = i * (isMobile ? 18 : 28);
      const targetScale = 0.90 + i * 0.025;

      // Pinning each card at top with staggered offset
      ScrollTrigger.create({
        trigger: card,
        start: () => `top top+=${isMobile ? 80 : 120 + stackOffset}`,
        endTrigger: stackEnd,
        end: 'top top+=65%',
        pin: true,
        pinSpacing: false,
        anticipatePin: 1
      });

      // Scaling down and blurring as subsequent cards stack over
      if (!isLast) {
        gsap.to(card, {
          scale: targetScale,
          filter: isMobile ? 'none' : 'blur(2px)',
          opacity: 0.88,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: stackCards[i + 1],
            start: () => `top top+=${isMobile ? 80 : 120 + stackOffset + 60}`,
            end: () => `top top+=${isMobile ? 80 : 120 + stackOffset}`,
            scrub: 0.5
          }
        });
      }
    });
  }

  // 7. FAQ Items Stagger Scroll In
  gsap.utils.toArray('.faq-item').forEach((item, index) => {
    gsap.fromTo(item,
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        delay: index * 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // 8. Contact Section Entrance
  gsap.fromTo('.conversational-brief-card',
    { y: 35, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.creative-contact-section',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    }
  );

  // 9. Footer Letters Reveal
  gsap.fromTo('.footer-letter-reveal',
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.1,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.monumental-footer',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    }
  );
}

/* ==========================================================================
   3. Interactive Peeking Eyes Cursor Tracking
   ========================================================================== */
function initInteractiveEyeTracking() {
  const pupilLeft = document.getElementById('pupilLeft');
  const pupilRight = document.getElementById('pupilRight');
  const eyesSvg = document.getElementById('peekingEyesSvg');
  if (!pupilLeft || !pupilRight || !eyesSvg) return;

  function trackPos(clientX, clientY) {
    const rect = eyesSvg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(5, Math.sqrt(dx * dx + dy * dy) / 30);

    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    pupilLeft.setAttribute('cx', 28 + px);
    pupilLeft.setAttribute('cy', 35 + py);
    pupilRight.setAttribute('cx', 72 + px);
    pupilRight.setAttribute('cy', 35 + py);
  }

  window.addEventListener('mousemove', (e) => trackPos(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      trackPos(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
}

/* ==========================================================================
   4. Interactive 3D Cursor Tilt on Paper Photo Card
   ========================================================================== */
function initPaperCard3DTilt() {
  const card = document.getElementById('paperCard');
  if (!card) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / rect.height) * 14;
    const rotY = (x / rect.width) * 14;

    card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotate(-1deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = `rotate(-3.5deg) scale(1)`;
  });
}

/* ==========================================================================
   5. Interactive Crosshair Grid Marker Highlighting
   ========================================================================== */
function initCrosshairIntersectionTracker() {
  const markers = document.querySelectorAll('.plus-marker');
  if (!markers.length) return;

  window.addEventListener('mousemove', (e) => {
    markers.forEach(marker => {
      const rect = marker.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        marker.style.opacity = '1';
      } else {
        marker.style.opacity = '';
      }
    });
  });
}

/* ==========================================================================
   6. Service Inquire Link Wiring
   ========================================================================== */
function initServiceInquireLinks() {
  document.querySelectorAll('.stack-inquire-btn, .service-inquire-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceName = btn.getAttribute('data-service') || '';
      const contactSection = document.getElementById('contact');

      if (contactSection && lenis) {
        lenis.scrollTo(contactSection, { offset: 0, duration: 1.2 });
      }

      const select = document.getElementById('briefType');
      if (select) {
        Array.from(select.options).forEach(opt => {
          if (serviceName.toLowerCase().includes(opt.value.toLowerCase().slice(0, 4))) {
            select.value = opt.value;
          }
        });
      }

      const nameInput = document.getElementById('briefName');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 600);
      }
    });
  });
}

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1536735455633211535/GlxsOfAJPAUx-lnfZVuMLk2r7w3K5tXR5gcfQ7NIEEpWPtZI10elGf21j9udxA8xpdn3';

/* ==========================================================================
   7. Cta1 Interactive Founder Hotline Handler
   ========================================================================== */
function initCta1FounderHotline() {
  const phoneForm = document.getElementById('cta1PhoneForm');
  const phoneInput = document.getElementById('cta1UserPhone');
  const submitBtn = document.getElementById('cta1SubmitBtn');
  const statusEl = document.getElementById('cta1Status');

  if (phoneForm && submitBtn) {
    phoneForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      if (!phoneVal) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>CONNECTING...</span>';
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--c-text-muted);">Transmitting number to founders & opening WhatsApp...</span>`;

      const payload = {
        username: "Nyghto Founder Hotline",
        avatar_url: "https://nyghto.in/favicon.png",
        embeds: [
          {
            title: "📞 New Direct Number Received (Talk with Founders)",
            description: `Client submitted their phone number: **\`${phoneVal}\`** on **[nyghto.in](https://nyghto.in/#consultation)**.`,
            color: 3462009, // Emerald
            fields: [
              { name: "📱 Phone / WhatsApp", value: phoneVal, inline: true },
              { name: "⏰ Submitted At", value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST", inline: true }
            ],
            footer: {
              text: "Nyghto Studio Direct Founder Connection",
              icon_url: "https://nyghto.in/favicon.png"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (window.nyghtoFirebase && typeof window.nyghtoFirebase.saveLead === 'function') {
          window.nyghtoFirebase.saveLead({
            type: 'Consultation Hotline',
            phone: phoneVal,
            source: 'Website #consultation',
            status: 'New'
          });
        }

        submitBtn.innerHTML = '<span>CONNECTED ✓</span>';
        submitBtn.style.background = '#34D399';
        submitBtn.style.color = '#064E3B';
        if (statusEl) statusEl.innerHTML = `<span style="color:#34D399;">✓ Number received! Connecting directly with founders on WhatsApp...</span>`;

        if (typeof playSynthTone === 'function') {
          playSynthTone(523.25);
          setTimeout(() => playSynthTone(659.25), 120);
          setTimeout(() => playSynthTone(783.99), 240);
        }

        setTimeout(() => {
          const waUrl = `https://wa.me/918590564004?text=${encodeURIComponent(`Hi Nyghto Founders, I'm reaching out from your website. My number is ${phoneVal}. I'd like to discuss a project.`)}`;
          window.open(waUrl, '_blank');
        }, 300);
      } catch (err) {
        console.warn('Hotline error:', err);
        const waUrl = `https://wa.me/918590564004?text=${encodeURIComponent(`Hi Nyghto Founders, I'm reaching out from your website. My number is ${phoneVal}.`)}`;
        window.open(waUrl, '_blank');
      } finally {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>CONNECT WITH FOUNDERS ↗</span>';
          submitBtn.style.background = '';
          submitBtn.style.color = '';
        }, 6000);
      }
    });
  }
}

/* ==========================================================================
   8. Conversational Brief Generator & Actions (Direct Discord Webhook Connection)
   ========================================================================== */
function initConversationalBrief() {
  const sendBtn = document.getElementById('sendBriefBtn');
  const copyBtn = document.getElementById('copyEmailBtn');
  const statusText = document.getElementById('briefStatusText');
  const nameInput = document.getElementById('briefName');
  const emailInput = document.getElementById('briefEmail');
  const budgetInput = document.getElementById('briefBudget');
  const typeSelect = document.getElementById('briefType');
  const otherWrap = document.getElementById('briefOtherWrap');
  const otherInput = document.getElementById('briefOtherType');

  if (typeSelect && otherWrap) {
    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'Other') {
        otherWrap.style.display = 'inline-flex';
        if (otherInput) otherInput.focus();
      } else {
        otherWrap.style.display = 'none';
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const company = document.getElementById('briefCompany').value.trim() || 'Undisclosed';
      let type = typeSelect ? typeSelect.value : 'Custom Project';
      if (type === 'Other') {
        const customDetail = (otherInput ? otherInput.value.trim() : '') || 'Custom Software Project';
        type = `Other (${customDetail})`;
      }
      const budget = (budgetInput ? budgetInput.value.trim() : '') || 'Flexible';
      const email = emailInput.value.trim();

      if (!name) {
        nameInput.focus();
        nameInput.style.borderBottomColor = '#F43F5E';
        if (statusText) statusText.innerHTML = `<span style="color:#F43F5E;">Please enter your name.</span>`;
        return;
      }

      if (!email || !email.includes('@')) {
        emailInput.focus();
        emailInput.style.borderBottomColor = '#F43F5E';
        if (statusText) statusText.innerHTML = `<span style="color:#F43F5E;">Please enter a valid email address.</span>`;
        return;
      }

      nameInput.style.borderBottomColor = '';
      emailInput.style.borderBottomColor = '';

      sendBtn.disabled = true;
      sendBtn.innerHTML = '<span>TRANSMITTING TO TEAM...</span>';
      if (statusText) statusText.innerHTML = `<span style="color:var(--c-text-muted);">Transmitting brief directly to Nyghto command center...</span>`;

      const payload = {
        username: "Nyghto Studio Brief Bot",
        avatar_url: "https://nyghto.in/favicon.png",
        embeds: [
          {
            title: "🚀 New Project Brief Received",
            description: `A new client has submitted a project brief on **[nyghto.in](https://nyghto.in/#contact)**.`,
            color: 74909, // #01249D Nyghto Cobalt
            fields: [
              { name: "👤 Client Name", value: name, inline: true },
              { name: "🏢 Company / Venture", value: company, inline: true },
              { name: "🛠️ Project Type", value: type, inline: true },
              { name: "💰 Estimated Budget", value: budget, inline: true },
              { name: "✉️ Direct Contact Email", value: email, inline: true },
              { name: "⏰ Submitted Time", value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST", inline: true }
            ],
            footer: {
              text: "Nyghto Digital Product Studio • Brief Ingestion",
              icon_url: "https://nyghto.in/favicon.png"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok || response.status === 204) {
          if (window.nyghtoFirebase && typeof window.nyghtoFirebase.saveLead === 'function') {
            window.nyghtoFirebase.saveLead({
              type: 'Project Brief',
              name: name,
              company: company,
              projectType: type,
              budget: budget,
              email: email,
              source: 'Website #contact',
              status: 'New'
            });
          }

          sendBtn.innerHTML = '<span>BRIEF TRANSMITTED ✓</span>';
          sendBtn.style.background = '#34D399';
          sendBtn.style.color = '#064E3B';

          if (statusText) {
            statusText.innerHTML = `✓ Transmitted directly to Nyghto team! We'll follow up at <strong>${email}</strong>.`;
          }

          playSynthTone(523.25);
          setTimeout(() => playSynthTone(659.25), 120);
          setTimeout(() => playSynthTone(783.99), 240);
        } else {
          throw new Error('Discord response not ok');
        }
      } catch (err) {
        console.warn('Webhook dispatch failed, falling back to mailto:', err);
        sendBtn.innerHTML = '<span>OPENING EMAIL...</span>';

        const subject = `[Project Brief] ${name} (${company}) — ${type}`;
        const bodyText = `Hello Nyghto Team,\n\nI am ${name} from ${company}.\nWe would like to engineer a ${type} with an estimated budget of ${budget}.\n\nReach me at: ${email}\n\nSent from nyghto.in brief generator.`;

        if (statusText) {
          statusText.innerHTML = `✓ Preparing direct email to <strong>hello@nyghto.in</strong>...`;
        }

        window.location.href = `mailto:hello@nyghto.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      } finally {
        setTimeout(() => {
          sendBtn.disabled = false;
        }, 4000);
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('hello@nyghto.in').then(() => {
        copyBtn.innerHTML = '<span>COPIED TO CLIPBOARD ✓</span>';
        copyBtn.style.borderColor = '#34D399';
        copyBtn.style.color = '#34D399';

        setTimeout(() => {
          copyBtn.innerHTML = '<span>COPY EMAIL (hello@nyghto.in)</span>';
          copyBtn.style.borderColor = '';
          copyBtn.style.color = '';
        }, 2500);

        playSynthTone(659.25);
      }).catch(() => {
        window.location.href = 'mailto:hello@nyghto.in';
      });
    });
  }
}

/* ==========================================================================
   8. Web Audio Synthesizer Tone
   ========================================================================== */
let audioCtx;

function getAudioContext() {
  if (!audioCtx && typeof window.AudioContext !== 'undefined') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynthTone(freq) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

/* ==========================================================================
   9. Interactive FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherBtn = otherItem.querySelector('.faq-question-btn');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current
      if (isActive) {
        item.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        playSynthTone(587.33);
      }
    });
  });
}

/* ==========================================================================
   10. Dynamic CMS Content Sync (Synced from Nyghto Studio Admin Command Center)
   ========================================================================== */
function initSiteCmsOverrides() {
  function renderProjectCardHtml(p, i) {
    const numStr = (i + 1).toString().padStart(2, '0');
    return `
      <article class="editorial-project-row">
        <div class="project-num-col font-mono">${numStr}</div>
        <div class="project-info-col">
          <div class="project-header-line">
            <h2 class="project-big-name font-display">${escapeHtml(p.name || 'Untitled Project')}</h2>
            ${p.url ? `
              <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="project-live-badge font-mono dot-box" aria-label="Visit ${escapeHtml(p.name)}">
                ${escapeHtml(p.url.replace(/^https?:\/\//, ''))} ↗
              </a>
            ` : ''}
          </div>
          <p class="project-human-summary font-sans">${escapeHtml(p.summary || '')}</p>
          <div class="project-details-bar font-mono">
            <div class="p-detail-item">
              <span class="p-detail-key">SCOPE</span>
              <span class="p-detail-val">${escapeHtml(p.scope || 'Design & Engineering')}</span>
            </div>
            <div class="p-detail-item">
              <span class="p-detail-key">STATUS</span>
              <span class="p-detail-val">${escapeHtml(p.status || 'Live in Production')}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function applyCms(cfg) {
    if (!cfg) return;

    // 1. Hotline / WhatsApp Phone
    if (cfg.phone) {
      const cleanPhone = cfg.phone.replace(/[^0-9]/g, '');
      const waNumber = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      
      // Update WhatsApp links
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        el.href = `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi Nyghto Founders, I'm reaching out from your website to discuss a project")}`;
      });

      // Update tel links
      document.querySelectorAll('a[href^="tel:"]').forEach(el => {
        if (!el.href.includes('8075911860') && !el.href.includes('9539202847')) {
          el.href = `tel:${cfg.phone}`;
        }
      });
    }

    // 2. Studio Email
    if (cfg.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = `mailto:${cfg.email}`;
        if (el.textContent.includes('@')) {
          el.textContent = cfg.email;
        }
      });
    }

    // 3. Hero Tagline
    if (cfg.heroTagline) {
      const heroTag = document.querySelector('.hero-info-grid .bold-tag');
      if (heroTag) {
        heroTag.innerHTML = cfg.heroTagline.replace(/\n/g, '<br>');
      }
    }

    // 4. Hero Subtitle / Location
    if (cfg.heroLocation) {
      const heroLoc = document.querySelector('.hero-info-grid .info-block-right p');
      if (heroLoc) {
        heroLoc.innerHTML = cfg.heroLocation;
      }
    }

    // 5. Studio Availability Status
    if (cfg.availabilityStatus) {
      const availEl = document.querySelector('.status-pill-text');
      if (availEl) {
        availEl.textContent = cfg.availabilityStatus;
      }
    }

    // 6. Dynamic FAQ Items Rendering
    if (cfg.faqs && Array.isArray(cfg.faqs) && cfg.faqs.length > 0) {
      const faqList = document.getElementById('faqAccordionList');
      if (faqList) {
        faqList.innerHTML = cfg.faqs.map((f, i) => `
          <div class="faq-item ${i === 0 ? 'active' : ''}">
            <button type="button" class="faq-question-btn" aria-expanded="${i === 0 ? 'true' : 'false'}">
              <span>${escapeHtml(f.question)}</span>
              <span class="faq-icon-indicator">+</span>
            </button>
            <div class="faq-answer-panel">
              <p class="faq-answer-text">${f.answer}</p>
            </div>
          </div>
        `).join('');
        // Rebind click toggles
        if (typeof initFaqAccordion === 'function') {
          initFaqAccordion();
        }
      }
    }

    // 7. Dynamic Work Projects Rendering (both work.html AND index.html)
    if (cfg.projects && Array.isArray(cfg.projects) && cfg.projects.length > 0) {
      const htmlContent = cfg.projects.map(renderProjectCardHtml).join('');

      // Render on work.html showcase container
      const workList = document.getElementById('workProjectList');
      if (workList) {
        workList.innerHTML = htmlContent;
      }

      // Render on index.html showcase container
      const homeWorkList = document.getElementById('homeWorkProjectList');
      if (homeWorkList) {
        homeWorkList.innerHTML = htmlContent;
      }

      // Refresh ScrollTrigger so pinning & mobile parallax don't get miscalculated
      if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 1. Immediately apply embedded static CMS store if available (instant on mobile & offline)
  if (window.NYGHTO_CMS_DATA) {
    applyCms(window.NYGHTO_CMS_DATA);
  }

  // 2. Load from local cache
  try {
    const cached = JSON.parse(localStorage.getItem('nyghto_site_cms') || 'null');
    if (cached) applyCms(cached);
  } catch (e) {}

  // 3. Fetch live data from server API (/api/cms) or fallback to /cms-data.json
  const fetchCmsData = (url) => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : Promise.reject());
  fetchCmsData('/api/cms')
    .catch(() => fetchCmsData('/cms-data.json'))
    .then(cfg => {
      if (cfg) {
        applyCms(cfg);
        try { localStorage.setItem('nyghto_site_cms', JSON.stringify(cfg)); } catch (e) {}
      }
    })
    .catch(() => {});

  // 4. Listen for cross-tab storage changes (Real-Time multi-tab sync)
  window.addEventListener('storage', (e) => {
    if (e.key === 'nyghto_site_cms' && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        if (updated) applyCms(updated);
      } catch (err) {}
    }
  });

  // 5. If Firebase is initialized, check remote config
  if (window.nyghtoFirebase && typeof window.nyghtoFirebase.getSiteConfig === 'function') {
    window.nyghtoFirebase.getSiteConfig().then(cfg => {
      if (cfg) applyCms(cfg);
    }).catch(e => console.warn('CMS remote fetch notice:', e));
  }
}



