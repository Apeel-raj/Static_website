document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Theme Toggle Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const isDark = localStorage.getItem('theme') === 'light' ? false : true;
    
    // Set initial theme
    if (!isDark) root.setAttribute('data-theme', 'light');

    // Handle toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Dispatch event so ThreeJS knows to update colors
        window.dispatchEvent(new Event('themeChanged'));
    });

    // Check if device is touch
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // --- 3. GSAP Animations ---
    gsap.registerPlugin(ScrollTrigger);

    // Split text for stagger animations
    const staggerTexts = document.querySelectorAll('.stagger-text');
    staggerTexts.forEach(text => {
        // Simple word/char split (could use SplitText plugin, but doing manually for free)
        const content = text.innerHTML;
        // Basic split by characters except for the <br> or <span class="highlight">
        // To keep it safe and simple, we'll just stagger by lines or words, or use a simple fade-up stagger
    });

    // Instead of complex split text, let's use GSAP for smooth fade-ups on all elements
    const fadeUps = document.querySelectorAll('.fade-up, .stagger-text');
    fadeUps.forEach((el, index) => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%", // Trigger when top of element hits 85% of viewport
                toggleActions: "play none none none"
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            delay: index * 0.05 // slight stagger based on order in DOM
        });
    });

    // --- 4. SVG Scroll Animation ---
    const scrollPath = document.getElementById('scroll-path');
    if(scrollPath) {
        const pathLength = scrollPath.getTotalLength();
        scrollPath.style.strokeDasharray = pathLength;
        scrollPath.style.strokeDashoffset = pathLength;
        
        gsap.to(scrollPath, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1
            }
        });
    }

    // --- 5. Advanced Three.js Scene ---
    if (!isTouchDevice) {
        initAdvancedThreeJS();
    }

    // --- 6. Project Card Interactions (3D Tilt & Glow) ---
    initProjectCardInteractions();
});

function initAdvancedThreeJS() {
    const container = document.getElementById('canvas-container');
    if(!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create a calm network of nodes
    const particlesCount = 250;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const darkColors = [new THREE.Color(0x888899), new THREE.Color(0x444455), new THREE.Color(0xffffff)];
    const lightColors = [new THREE.Color(0x666677), new THREE.Color(0xbbbbcc), new THREE.Color(0x000000)];
    let activeColors = document.documentElement.getAttribute('data-theme') === 'light' ? lightColors : darkColors;

    for(let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1000;     // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1000; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 500;  // z

        const color = activeColors[Math.floor(Math.random() * activeColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse Interaction Physics
    let mouseX = 0;
    let mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX - windowHalfX;
        mouseY = event.clientY - windowHalfY;
    });

    // Theme Sync Listener
    window.addEventListener('themeChanged', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        activeColors = isLight ? lightColors : darkColors;
        scene.fog.color.setHex(isLight ? 0xf5f5fa : 0x050505);
        
        const colorAttr = geometry.attributes.color;
        for(let i = 0; i < particlesCount; i++) {
            const color = activeColors[Math.floor(Math.random() * activeColors.length)];
            colorAttr.setXYZ(i, color.r, color.g, color.b);
        }
        colorAttr.needsUpdate = true;
    });
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    scene.fog.color.setHex(isLight ? 0xf5f5fa : 0x050505);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let scrollPercent = 0;
    document.addEventListener('scroll', () => {
        scrollPercent = document.documentElement.scrollTop / (document.documentElement.scrollHeight - document.documentElement.clientHeight);
    });

    function animate() {
        requestAnimationFrame(animate);

        // Slow, elegant rotation
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0008;

        // Subtle parallax
        camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.02;
        
        // Gentle scroll depth
        gsap.to(camera.position, {
            z: 400 - (scrollPercent * 300),
            duration: 1
        });

        renderer.render(scene, camera);
    }
    
    animate();
}

function initProjectCardInteractions() {
    const cards = document.querySelectorAll('.project-card');
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isTouch) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const percentX = (x - centerX) / centerX;
            const percentY = (y - centerY) / centerY;
            
            const rotateX = percentY * -8;
            const rotateY = percentX * 8;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
            card.style.boxShadow = `0 15px 30px rgba(0, 0, 0, 0.25)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}
