// ============================================================
//  VISION X CHEAT — Purple & White 3D Scene + UI Logic
// ============================================================

(() => {
    'use strict';

    // --------------------------------------------------------
    //  1.  Three.js Scene
    // --------------------------------------------------------
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --------------------------------------------------------
    //  2.  Central Torus Knot — crystal-like hero object
    // --------------------------------------------------------
    const knotGeo = new THREE.TorusKnotGeometry(8, 2.5, 180, 24, 2, 3);
    const knotMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        wireframe: true,
        transparent: true,
        opacity: 0.07
    });
    const torusKnot = new THREE.Mesh(knotGeo, knotMat);
    scene.add(torusKnot);

    // Inner Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(5, 1);
    const icoMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        wireframe: true,
        transparent: true,
        opacity: 0.06
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    scene.add(ico);

    // Core Sphere (soft glow center)
    const coreGeo = new THREE.SphereGeometry(2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xd8b4fe,
        transparent: true,
        opacity: 0.025
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // --------------------------------------------------------
    //  3.  Orbital Rings
    // --------------------------------------------------------
    function makeRing(radius, color, opacity, rx, rz) {
        const geo = new THREE.TorusGeometry(radius, 0.025, 16, 256);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = rx;
        mesh.rotation.z = rz;
        return mesh;
    }

    const ring1 = makeRing(12, 0xa855f7, 0.1, Math.PI / 2, 0.4);
    const ring2 = makeRing(14, 0xc084fc, 0.06, Math.PI / 2.3, -0.6);
    const ring3 = makeRing(16.5, 0xd8b4fe, 0.04, Math.PI / 2.6, 0.9);
    scene.add(ring1, ring2, ring3);

    // --------------------------------------------------------
    //  4.  Particle Field — purple & white
    // --------------------------------------------------------
    const pCount = 3000;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    const c1 = new THREE.Color(0xa855f7);
    const c2 = new THREE.Color(0xd8b4fe);
    const c3 = new THREE.Color(0xffffff);

    for (let i = 0; i < pCount; i++) {
        const i3 = i * 3;
        const r = 15 + Math.random() * 90;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pPositions[i3]     = r * Math.sin(phi) * Math.cos(theta);
        pPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pPositions[i3 + 2] = r * Math.cos(phi);

        const pick = Math.random();
        const color = pick < 0.4 ? c1 : pick < 0.75 ? c2 : c3;
        pColors[i3]     = color.r;
        pColors[i3 + 1] = color.g;
        pColors[i3 + 2] = color.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --------------------------------------------------------
    //  5.  Floating Crystal Debris
    // --------------------------------------------------------
    const debrisGroup = new THREE.Group();
    scene.add(debrisGroup);

    const shapes = [
        new THREE.OctahedronGeometry(0.35, 0),
        new THREE.TetrahedronGeometry(0.3, 0),
        new THREE.IcosahedronGeometry(0.25, 0)
    ];
    const debrisColors = [0xa855f7, 0xc084fc, 0xd8b4fe, 0xffffff];

    for (let i = 0; i < 30; i++) {
        const geo = shapes[Math.floor(Math.random() * shapes.length)];
        const mat = new THREE.MeshBasicMaterial({
            color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
            wireframe: true,
            transparent: true,
            opacity: 0.08 + Math.random() * 0.12
        });
        const mesh = new THREE.Mesh(geo, mat);
        const spread = 55;
        mesh.position.set(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread * 0.7,
            (Math.random() - 0.5) * spread * 0.5
        );
        mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);
        mesh.userData.speed = 0.001 + Math.random() * 0.004;
        debrisGroup.add(mesh);
    }

    // --------------------------------------------------------
    //  6.  Mouse Parallax
    // --------------------------------------------------------
    let mx = 0, my = 0;
    document.addEventListener('mousemove', (e) => {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 → 1
        my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // --------------------------------------------------------
    //  7.  Animate
    // --------------------------------------------------------
    const clock = new THREE.Clock();

    function loop() {
        requestAnimationFrame(loop);
        const t = clock.getElapsedTime();

        // Knot rotation
        torusKnot.rotation.y = t * 0.06;
        torusKnot.rotation.x = t * 0.04;

        // Ico counter-rotation
        ico.rotation.y = -t * 0.1;
        ico.rotation.z = t * 0.06;

        // Core pulse
        const p = 1 + Math.sin(t * 1.8) * 0.1;
        core.scale.set(p, p, p);
        coreMat.opacity = 0.02 + Math.sin(t * 1.2) * 0.015;

        // Rings spin
        ring1.rotation.z = 0.4 + t * 0.12;
        ring2.rotation.z = -0.6 - t * 0.08;
        ring3.rotation.z = 0.9 + t * 0.05;

        // Particles drift
        particles.rotation.y = t * 0.012;
        particles.rotation.x = t * 0.006;

        // Debris spin
        debrisGroup.children.forEach(d => {
            d.rotation.x += d.userData.speed;
            d.rotation.y += d.userData.speed * 0.6;
        });

        // Parallax camera
        camera.position.x += (mx * 4 - camera.position.x) * 0.025;
        camera.position.y += (-my * 2.5 - camera.position.y) * 0.025;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    loop();

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --------------------------------------------------------
    //  8.  GSAP Entrance
    // --------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.to('#generator-card', { opacity: 1, y: 0, scale: 1, duration: 1.2, delay: 0.25 });
        tl.to('#keygen-pill', { display: 'flex', opacity: 1, duration: 0.4 }, '-=0.5');
        tl.to('#pro-badge', { display: 'inline-block', opacity: 1, duration: 0.4 }, '-=0.4');
    });

    // --------------------------------------------------------
    //  9.  UI Logic
    // --------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        const verifyBtn   = document.getElementById('watch-ad-btn');
        const claimBtn    = document.getElementById('claim-btn');
        const resultArea  = document.getElementById('result-area');
        const keyInput    = document.getElementById('generated-key');
        const copyBtn     = document.getElementById('copy-btn');
        const copyIcon    = document.getElementById('copy-icon');

        // Verify click
        verifyBtn.addEventListener('click', () => {
            setTimeout(() => {
                verifyBtn.innerHTML = `
                    <i class="fa-solid fa-circle-check" style="color:#22c55e;"></i>
                    <span style="color:#22c55e;">Verification Opened</span>
                `;
                verifyBtn.style.borderColor = 'rgba(34,197,94,0.25)';
            }, 250);
        });
        // Reveal Key function (accessible to both load checker and click listener)
        function revealKey(key) {
            keyInput.value = key;
            resultArea.style.display = 'flex';
            resultArea.classList.add('show');
            claimBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Key Generated';
            claimBtn.classList.add('btn-success-state');
            gsap.fromTo(resultArea, 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
        }

        // Check on load if this IP already has a key generated
        async function checkExistingKey() {
            try {
                const res = await fetch('/api/check-key');
                const data = await res.json();
                if (data.success && data.key) {
                    revealKey(data.key);
                    claimBtn.disabled = true; // Disable if they already claimed
                }
            } catch (err) {
                console.error('Failed to check existing key', err);
            }
        }
        checkExistingKey();

        // Generate
        claimBtn.addEventListener('click', async () => {
            const original = claimBtn.innerHTML;
            claimBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            claimBtn.disabled = true;

            try {
                const res = await fetch('/api/generate-key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const data = await res.json();
                if (data.success && data.key) {
                    revealKey(data.key);
                } else {
                    throw new Error(data.message || 'Error');
                }
            } catch {
                const seg = () => Math.random().toString(36).substring(2, 8).toUpperCase();
                revealKey(`VISION-${seg()}-${seg()}`);
            }
            }
        });

        // Copy
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(keyInput.value).then(() => {
                copyIcon.className = 'fa-solid fa-check';
                copyBtn.style.background = '#a855f7';
                copyBtn.style.color = '#fff';
                setTimeout(() => {
                    copyIcon.className = 'fa-regular fa-copy';
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                }, 2000);
            });
        });
    });

})();
