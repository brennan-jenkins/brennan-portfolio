// Scoped to avoid clashing with main.js globals
(function () {
  const canvas = document.getElementById('heroCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!canvas || typeof THREE === 'undefined' || reduceMotion) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  camera.position.z = 4;

  const particleCount = window.innerWidth < 768 ? 500 : 750;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const accent = new THREE.Color(0x9575cd);
  const warm = new THREE.Color(0xa3e635);
  const muted = new THREE.Color(0x3a3848);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = 2 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    const mix = Math.random();
    const color = mix < 0.15 ? warm : mix < 0.35 ? accent : muted;
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const hero = document.getElementById('hero');
  let isHeroVisible = true;
  let rafId = null;
  let time = 0;

  function resizeRenderer() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return false;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    return true;
  }

  hero?.addEventListener(
    'mousemove',
    (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    },
    { passive: true }
  );

  hero?.addEventListener(
    'mouseleave',
    () => {
      mouse.targetX = 0;
      mouse.targetY = 0;
    },
    { passive: true }
  );

  function tick() {
    rafId = null;

    if (!isHeroVisible || document.hidden) {
      return;
    }

    if (!resizeRenderer()) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    time += 0.004;

    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    particles.rotation.y = time * 0.15 + mouse.x * 0.3;
    particles.rotation.x = mouse.y * 0.2;

    camera.position.x = mouse.x * 0.25;
    camera.position.y = mouse.y * 0.25;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId === null && isHeroVisible && !document.hidden) {
      resizeRenderer();
      rafId = requestAnimationFrame(tick);
    }
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  if (hero) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { rootMargin: '80px 0px', threshold: 0 }
    );
    heroObserver.observe(hero);
  }

  const resizeObserver = new ResizeObserver(() => {
    resizeRenderer();
  });
  resizeObserver.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  resizeRenderer();
  startLoop();

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      stopLoop();
      canvas.style.display = 'none';
    }
  });
})();
