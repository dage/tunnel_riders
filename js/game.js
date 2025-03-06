// js/game.js

class TunnelRiders {
    constructor() {
        this.init();
        this.createTunnel();
        this.animate();
    }

    init() {
        // Initialize scene, camera, and renderer
        this.scene = new THREE.Scene();
        
        // Camera setup with perspective
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.z = 5; // Position camera inside the tunnel
        
        // Set up WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000); // Black background
        document.body.appendChild(this.renderer.domElement);
        
        // Add some ambient light to see the tunnel
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Add directional light to create depth
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 1);
        this.scene.add(directionalLight);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Tunnel segments and properties
        this.tunnelSegments = [];
        this.maxSegments = 100; // Number of segments in the tunnel
        this.segmentLength = 1; // Length between segments
        this.tunnelRadius = 5; // Initial tunnel radius
        this.tunnelVariation = 0.2; // Amount of variation in tunnel shape
        this.tunnelCurvature = 0.1; // How much the tunnel curves
        this.lastPosition = new THREE.Vector3(0, 0, 0);
        this.lastDirection = new THREE.Vector3(0, 0, -1);
    }

    createTunnelSegment(position, index) {
        // Create a ring geometry for the tunnel segment
        const radiusSegment = this.tunnelRadius * (1 + Math.sin(index * 0.1) * this.tunnelVariation);
        const geometry = new THREE.TorusGeometry(radiusSegment, 0.1, 8, 30);
        
        // Create a material with neon/glow effect
        const color = new THREE.Color();
        color.setHSL(index % 10 / 10, 1, 0.5); // Cycle through colors
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide,
            flatShading: true,
        });
        
        // Create mesh and position it
        const segment = new THREE.Mesh(geometry, material);
        segment.position.copy(position);
        
        // Rotate to face the direction of travel
        segment.lookAt(position.clone().add(this.lastDirection));
        segment.rotation.z = index * 0.03; // Add slight rotation for interesting effect
        
        // Add to scene and store reference
        this.scene.add(segment);
        return segment;
    }

    createTunnel() {
        // Generate initial tunnel segments along a curved path
        for (let i = 0; i < this.maxSegments; i++) {
            // Calculate new position with some curvature
            const offset = new THREE.Vector3(
                Math.sin(i * this.tunnelCurvature) * 2,
                Math.cos(i * this.tunnelCurvature * 0.7) * 2,
                -i * this.segmentLength
            );
            
            // Update direction vector (normalized)
            if (i > 0) {
                this.lastDirection = new THREE.Vector3()
                    .subVectors(offset, this.lastPosition)
                    .normalize();
            }
            
            // Create segment and add to array
            const segment = this.createTunnelSegment(offset, i);
            this.tunnelSegments.push(segment);
            this.lastPosition.copy(offset);
        }
    }

    updateTunnel() {
        // Speed of travel
        const speed = 0.15;
        
        // Move all segments toward the camera
        this.tunnelSegments.forEach(segment => {
            segment.position.z += speed;
            
            // If segment is behind camera, move it to the end of the tunnel
            if (segment.position.z > 5) {
                // Calculate new position based on the last segment
                const lastSegment = this.tunnelSegments[this.tunnelSegments.length - 1];
                
                // Get direction vector from previous segments
                const direction = new THREE.Vector3().subVectors(
                    this.tunnelSegments[this.tunnelSegments.length - 1].position,
                    this.tunnelSegments[this.tunnelSegments.length - 2].position
                ).normalize();
                
                // Add some randomness to direction
                direction.x += (Math.random() - 0.5) * this.tunnelCurvature;
                direction.y += (Math.random() - 0.5) * this.tunnelCurvature;
                direction.normalize();
                
                // Calculate new position
                const newPosition = lastSegment.position.clone().add(
                    direction.multiplyScalar(-this.segmentLength * this.maxSegments)
                );
                
                // Update segment
                segment.position.copy(newPosition);
                segment.lookAt(newPosition.clone().add(direction));
                
                // Move to end of array (FIFO)
                this.tunnelSegments.push(this.tunnelSegments.shift());
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update tunnel
        this.updateTunnel();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TunnelRiders();
}); 