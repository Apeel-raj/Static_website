// --- Global UI & Custom Cursor ---
const cursor = document.querySelector('.custom-cursor');
const follower = document.querySelector('.cursor-follower');
const interactables = document.querySelectorAll('a, input, .interactive-card');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Immediate cursor update
    cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
});

// Smooth follower using requestAnimationFrame
function animateCursor() {
    followerX += (mouseX - followerX) * 0.15;
    followerY += (mouseY - followerY) * 0.15;
    follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
    requestAnimationFrame(animateCursor);
}
animateCursor();

interactables.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// --- Navbar Blur on Scroll ---
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// --- Text Reveal Observers ---
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-text').forEach(el => observer.observe(el));


// --- 3D Glass Card Tilt Effect ---
const card = document.querySelector('.glass-card');
if (card) {
    card.addEventListener('mousemove', (e) => {
        let rect = card.getBoundingClientRect();
        let x = e.clientX - rect.left; // x position within the element
        let y = e.clientY - rect.top; // y position within the element
        
        let centerX = rect.width / 2;
        let centerY = rect.height / 2;
        
        let rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
        let rotateY = ((x - centerX) / centerX) * 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    });
}


// --- Canvas Image Sequence Logic ---
const canvas = document.getElementById("hero-canvas");
const context = canvas.getContext("2d");

const frameCount = 150; 
const currentFrame = index => (
    // Format index to 3 digits e.g. 001, 150
    `frames/${index.toString().padStart(3, '0')}.png`
);

const images = [];
const imageAssets = {
    loaded: 0
};

// Preload images
function preloadImages() {
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            imageAssets.loaded++;
            if (imageAssets.loaded === 1) {
                // Draw first frame ASAP
                renderFrame(0);
            }
        };
        images.push(img);
    }
}

// Ensure Canvas fills screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    // We make it slightly taller to avoid gaps on mobile browser bar hide/show
    canvas.height = window.innerHeight; 
    renderFrame(Math.floor(calcFrameIndex()));
}

window.addEventListener('resize', resizeCanvas);

function renderFrame(index) {
    if (images[index] && images[index].complete) {
        // Draw image covering the canvas (object-fit cover logic)
        const img = images[index];
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
            
        }
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
}

function calcFrameIndex() {
    // Determine scroll progress
    // We want the animation to finish by the time the user scrolls down completely.
    const scrollTop = document.documentElement.scrollTop;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    
    if (maxScrollTop <= 0) return 0; // Prevent div by 0

    const scrollFraction = scrollTop / maxScrollTop;
    
    // Map fraction to frame index. 
    // Example: If we only want the blast to happen during the first 2 sections, 
    // we would multiply the fraction. But for now, we stretch it across the whole scroll.
    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount)
    );
    
    return frameIndex;
}

// Request Animation Frame loop for smooth canvas updates
function updateCanvas() {
    renderFrame(calcFrameIndex());
    requestAnimationFrame(updateCanvas);
}

// Init
resizeCanvas(); // Set dimensions
preloadImages(); // Start loading logic
requestAnimationFrame(updateCanvas); // Start loop
