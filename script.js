document.addEventListener('DOMContentLoaded', () => {
    // Dynamic year
    document.getElementById('year').textContent = new Date().getFullYear();

    // Setup Vanilla 3D Tilt Effect
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', handleTilt);
        card.addEventListener('mouseleave', resetTilt);
        card.addEventListener('mouseenter', enterTilt);
    });

    function handleTilt(e) {
        const card = this;
        const rect = card.getBoundingClientRect();
        
        // Find cursor position within the card
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate percentages from center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Intensity of tilt (higher denominator = less tilt)
        const tiltX = (y - centerY) / 15;
        const tiltY = (centerX - x) / 15;
        
        card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        // Dynamic lighting based on cursor simulating realistic reflections
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        
        card.style.background = `
            radial-gradient(
                circle at ${glareX}% ${glareY}%, 
                rgba(255, 255, 255, 0.08) 0%, 
                rgba(255, 255, 255, 0.02) 40%, 
                rgba(0,0,0,0.2) 100%
            ),
            rgba(255, 255, 255, 0.03) /* Base glass card bg */
        `;
    }

    function resetTilt() {
        const card = this;
        card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.background = `rgba(255, 255, 255, 0.03)`;
        card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), background 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    }

    function enterTilt() {
        const card = this;
        card.style.transition = 'none'; // remove transition for smooth instant tracking
    }

    // ----------------------------------------------------
    // Three.js Background Implementation (Realistic Ambient WebGL)
    // ----------------------------------------------------
    if (typeof THREE !== 'undefined') {
        const canvasContainer = document.getElementById('canvas-container');
        const scene = new THREE.Scene();
        // Atmospheric fog for depth realism
        scene.fog = new THREE.FogExp2(0x050508, 0.001);
        
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.z = 150;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high DPI monitors
        canvasContainer.appendChild(renderer.domElement);

        // Group for geometry objects
        const particles = new THREE.Group();
        scene.add(particles);

        // Core geometries
        const geometry1 = new THREE.TorusKnotGeometry(12, 4, 150, 20);
        const geometry2 = new THREE.IcosahedronGeometry(15, 0); 
        const geometry3 = new THREE.OctahedronGeometry(10, 0);
        
        // Highly realistic materials
        const material1 = new THREE.MeshPhysicalMaterial({
            color: 0x00d2ff,
            metalness: 0.9,
            roughness: 0.2,
            transmission: 0.8, // glass-like
            thickness: 1.0,
            ior: 1.5,
            transparent: true,
            opacity: 0.4,
            wireframe: false
        });

        const material2 = new THREE.MeshPhysicalMaterial({
            color: 0x8a2be2,
            metalness: 0.8,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });

        const shapes = [geometry1, geometry2, geometry3];
        const materials = [material1, material2];

        // Instantiate meshes
        for(let i=0; i<40; i++) {
            const shapeGeo = shapes[Math.floor(Math.random() * shapes.length)];
            const shapeMat = materials[Math.floor(Math.random() * materials.length)];
            
            const mesh = new THREE.Mesh(shapeGeo, shapeMat);
            
            mesh.position.x = (Math.random() - 0.5) * 600;
            mesh.position.y = (Math.random() - 0.5) * 600;
            mesh.position.z = (Math.random() - 0.5) * 600 - 100;
            
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            
            mesh.scale.setScalar(Math.random() * 0.7 + 0.3);
            
            particles.add(mesh);
        }

        // Illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x00d2ff, 2, 400);
        pointLight1.position.set(100, 100, 100);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff00ff, 2, 400);
        pointLight2.position.set(-100, -100, 100);
        scene.add(pointLight2);

        // Smooth Mouse Interactivity
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - window.innerWidth / 2) * 2;
            mouseY = (event.clientY - window.innerHeight / 2) * 2;
        });

        // Loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Continuous subtle rotation
            particles.children.forEach((mesh, index) => {
                mesh.rotation.y += 0.0005 * (index % 2 === 0 ? 1 : -1);
                mesh.rotation.x += 0.0002;
            });

            // Parallax easing
            targetX = mouseX * 0.02;
            targetY = mouseY * 0.02;

            camera.position.x += (targetX - camera.position.x) * 0.02;
            camera.position.y += (-targetY - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
        
        animate();

        // Canvas scaling
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
});
