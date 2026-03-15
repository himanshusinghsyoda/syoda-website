/* =============================================================
   SYODA TECHNOLOGY PVT. LTD. — MAIN JAVASCRIPT
   File: script.js
   Description: All interactive behaviour and 3D animations.
   Structure:
     01. Three.js — 3D WebGL Background
         a. Scene, Camera, Renderer Setup
         b. Particle Field
         c. Neural Network Lines
         d. Floating Geometric Shapes
         e. Mouse Parallax
         f. Animation Loop
     02. Scroll Animations (Intersection Observer)
     03. Header Scroll Effect
     04. Animated Statistics Counter
     05. Mobile Navigation Toggle
     06. Modal Open / Close Handlers
   ============================================================= */


/* ─────────────────────────────────────────────────────────────
   01. THREE.JS — 3D WEBGL BACKGROUND
   Uses Three.js r128 loaded via CDN in index.html
   ───────────────────────────────────────────────────────────── */

(function initThreeBackground() {

  // ── a. Scene, Camera, Renderer Setup ────────────────────────

  const canvas = document.getElementById('canvas3d');

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true              // transparent background — body bg shows through
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);  // fully transparent clear

  const scene  = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,                                          // field of view (degrees)
    window.innerWidth / window.innerHeight,      // aspect ratio
    0.1,                                         // near clip plane
    1000                                         // far clip plane
  );
  camera.position.set(0, 0, 50);


  // ── b. Particle Field ────────────────────────────────────────

  const PARTICLE_COUNT = 2000;
  const particleGeo    = new THREE.BufferGeometry();

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);
  const sizes     = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Random position spread across scene
    positions[i * 3]     = (Math.random() - 0.5) * 200;  // x
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;  // y
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;  // z

    // Alternate between cyan (#00d4ff) and purple (#7b2ff7)
    const useCyan = Math.random() < 0.5;
    colors[i * 3]     = useCyan ? 0    : 0.48;   // R
    colors[i * 3 + 1] = useCyan ? 0.83 : 0.18;   // G
    colors[i * 3 + 2] = useCyan ? 1    : 0.97;   // B

    // Random particle sizes
    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
  particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

  const particleMat = new THREE.PointsMaterial({
    size:           0.4,
    vertexColors:   true,
    transparent:    true,
    opacity:        0.75,
    blending:       THREE.AdditiveBlending,  // bright additive glow effect
    sizeAttenuation: true
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);


  // ── c. Neural Network Lines ──────────────────────────────────

  const NODE_COUNT    = 60;
  const CONNECT_DIST  = 28;   // max distance between connected nodes
  const linesGroup    = new THREE.Group();
  const nodePositions = [];

  // Generate random node positions
  for (let i = 0; i < NODE_COUNT; i++) {
    nodePositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 120,
      (Math.random() - 0.5) * 120,
      (Math.random() - 0.5) * 40
    ));
  }

  const lineMaterial = new THREE.LineBasicMaterial({
    color:       0x00d4ff,    // cyan
    transparent: true,
    opacity:     0.08
  });

  // Connect nodes that are close enough
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      if (nodePositions[i].distanceTo(nodePositions[j]) < CONNECT_DIST) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          nodePositions[i],
          nodePositions[j]
        ]);
        linesGroup.add(new THREE.Line(lineGeo, lineMaterial));
      }
    }
  }

  scene.add(linesGroup);


  // ── d. Floating Geometric Shapes ────────────────────────────

  const shapeGeometries = [
    new THREE.OctahedronGeometry(2),
    new THREE.TetrahedronGeometry(2),
    new THREE.IcosahedronGeometry(1.5),
    new THREE.BoxGeometry(2.5, 2.5, 2.5)
  ];

  const floatingShapes = [];

  for (let i = 0; i < 12; i++) {
    const material = new THREE.MeshBasicMaterial({
      color:       i % 2 === 0 ? 0x00d4ff : 0x7b2ff7,
      wireframe:   true,
      transparent: true,
      opacity:     0.12
    });

    const mesh = new THREE.Mesh(
      shapeGeometries[i % shapeGeometries.length],
      material
    );

    mesh.position.set(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 20 - 10
    );

    // Store per-shape velocity and rotation speed
    mesh.userData = {
      vx: (Math.random() - 0.5) * 0.04,   // x drift speed
      vy: (Math.random() - 0.5) * 0.04,   // y drift speed
      rx: Math.random() * 0.008,            // x rotation speed
      ry: Math.random() * 0.008             // y rotation speed
    };

    scene.add(mesh);
    floatingShapes.push(mesh);
  }


  // ── e. Mouse Parallax ────────────────────────────────────────

  let targetMouseX = 0;
  let targetMouseY = 0;

  document.addEventListener('mousemove', function (event) {
    // Normalise to -1 → +1 range
    targetMouseX =  (event.clientX / window.innerWidth  - 0.5) * 2;
    targetMouseY = -(event.clientY / window.innerHeight - 0.5) * 2;
  });

  // Handle window resize
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });


  // ── f. Animation Loop ────────────────────────────────────────

  function animate() {
    requestAnimationFrame(animate);

    // Slowly rotate the particle field
    particles.rotation.y += 0.0003;
    particles.rotation.x += 0.0001;

    // Slowly rotate the network lines
    linesGroup.rotation.y += 0.0002;

    // Smooth camera parallax following the mouse
    camera.position.x += (targetMouseX * 6 - camera.position.x) * 0.02;
    camera.position.y += (targetMouseY * 6 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    // Update floating shapes: drift + rotate + boundary bounce
    floatingShapes.forEach(function (shape) {
      shape.position.x += shape.userData.vx;
      shape.position.y += shape.userData.vy;
      shape.rotation.x  += shape.userData.rx;
      shape.rotation.y  += shape.userData.ry;

      // Bounce off invisible walls
      if (Math.abs(shape.position.x) > 50) shape.userData.vx *= -1;
      if (Math.abs(shape.position.y) > 50) shape.userData.vy *= -1;
    });

    renderer.render(scene, camera);
  }

  animate();

})(); // end initThreeBackground IIFE


/* ─────────────────────────────────────────────────────────────
   02. SCROLL ANIMATIONS (Intersection Observer)
   Elements with class "fade-in" animate up when scrolled into view
   ───────────────────────────────────────────────────────────── */

const fadeObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optional: unobserve after trigger for performance
        // fadeObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold:  0.1,
    rootMargin: '0px 0px -40px 0px'   // trigger slightly before fully in view
  }
);

document.querySelectorAll('.fade-in').forEach(function (el) {
  fadeObserver.observe(el);
});


/* ─────────────────────────────────────────────────────────────
   03. HEADER SCROLL EFFECT
   Adds/removes .scrolled class to change header opacity on scroll
   ───────────────────────────────────────────────────────────── */

const header = document.getElementById('mainHeader');

window.addEventListener('scroll', function () {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});


/* ─────────────────────────────────────────────────────────────
   04. ANIMATED STATISTICS COUNTER
   Counts up stat numbers when they scroll into viewport
   ───────────────────────────────────────────────────────────── */

function animateCounter(element, targetValue, suffix, prefix) {
  prefix  = prefix  || '';
  suffix  = suffix  || '';

  const DURATION    = 2000;  // animation duration in ms
  const STEP_TIME   = 16;    // ~60 fps
  const increment   = targetValue / (DURATION / STEP_TIME);
  let   currentVal  = 0;

  const timer = setInterval(function () {
    currentVal = Math.min(currentVal + increment, targetValue);

    // Format: integer vs decimal
    const displayVal = Number.isInteger(targetValue)
      ? Math.floor(currentVal)
      : currentVal.toFixed(1);

    element.textContent = prefix + displayVal + suffix;

    if (currentVal >= targetValue) {
      clearInterval(timer);
    }
  }, STEP_TIME);
}

const statObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const h3 = entry.target.querySelector('h3');
        if (!h3) return;

        const count  = parseFloat(h3.getAttribute('data-count'));
        const suffix = h3.getAttribute('data-suffix') || '';
        const prefix = h3.getAttribute('data-prefix') || '';

        if (!isNaN(count)) {
          animateCounter(h3, count, suffix, prefix);
        }

        statObserver.unobserve(entry.target);   // only animate once
      }
    });
  },
  { threshold: 0.5 }
);

document.querySelectorAll('.stat').forEach(function (stat) {
  statObserver.observe(stat);
});


/* ─────────────────────────────────────────────────────────────
   05. MOBILE NAVIGATION TOGGLE
   ───────────────────────────────────────────────────────────── */

/**
 * Opens the full-screen mobile navigation menu.
 * Called by the hamburger button in index.html.
 */
function toggleMobile() {
  const mobileNav = document.getElementById('mobileNav');
  mobileNav.classList.toggle('active');
  document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
}

/**
 * Closes the mobile navigation menu.
 * Called by nav links and the close button in index.html.
 */
function closeMobile() {
  const mobileNav = document.getElementById('mobileNav');
  mobileNav.classList.remove('active');
  document.body.style.overflow = '';
}

// Close mobile menu on Escape key
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeMobile();
    closeAllModals();
  }
});


/* ─────────────────────────────────────────────────────────────
   06. MODAL OPEN / CLOSE HANDLERS
   Three modals: terms, privacy, data
   ───────────────────────────────────────────────────────────── */

/**
 * Opens a legal modal by ID.
 * @param {string} id — 'terms' | 'privacy' | 'data'
 */
function openModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';  // prevent background scroll
}

/**
 * Closes a specific legal modal by ID.
 * @param {string} id — 'terms' | 'privacy' | 'data'
 */
function closeModal(id) {
  const modal = document.getElementById('modal-' + id);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Closes all open modals.
 * Called on Escape key press.
 */
function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.classList.remove('active');
  });
  document.body.style.overflow = '';
}

// Close modal when clicking outside the modal box (on the dark overlay)
document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) {          // only if clicking the backdrop
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});
