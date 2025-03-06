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
        this.segmentLength = 0.5; // Length between segments (reduced for more density)
        this.tunnelRadius = 5; // Initial tunnel radius
        this.tunnelVariation = 0.2; // Amount of variation in tunnel shape
        this.tunnelCurvature = 0.1; // How much the tunnel curves
        this.lastPosition = new THREE.Vector3(0, 0, 0);
        this.lastDirection = new THREE.Vector3(0, 0, -1);
        
        // Noise parameters for smooth variation
        this.noiseOffset = 0;
        this.noiseScale = 0.05; // Smaller scale = more dramatic curves
        this.noiseSpeed = 0.01;
        this.amplitudeFactor = 4.0; // Increased amplitude for more dramatic swings
        
        // Tunnel path control
        this.pathIndex = 0;
        this.pathStep = 0.02;
        
        // Debug trackers for continuous segments
        this.segmentCounter = 0;
        this.lastSegmentId = 0;
    }

    // Enhanced noise function for more dramatic curves
    noise(x) {
        return Math.sin(x) * Math.cos(x * 2.5) * Math.sin(x * 0.8 + Math.cos(x * 3));
    }

    // Generate path point at given index using noise with more variation
    getPathPoint(index) {
        // Create more dramatic x/y movements using the noise function
        const noiseVal1 = this.noise(index * this.noiseScale);
        const noiseVal2 = this.noise(index * this.noiseScale + 100);
        
        // Apply increased amplitude for more dramatic swings
        const x = noiseVal1 * this.amplitudeFactor;
        const y = noiseVal2 * this.amplitudeFactor;
        const z = -index * this.segmentLength;
        
        return new THREE.Vector3(x, y, z);
    }

    createTunnelSegment(position, index) {
        // Create a ring geometry for the tunnel segment
        const radiusSegment = this.tunnelRadius * (1 + this.noise(index * 0.1) * this.tunnelVariation);
        const geometry = new THREE.TorusGeometry(radiusSegment, 0.2, 8, 30); // Thicker rings
        
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
        
        // Assign an ID to help track segments
        segment.userData = { id: this.segmentCounter++ };
        
        // Rotate to face the direction of travel
        if (this.lastDirection.lengthSq() > 0) {
            segment.lookAt(position.clone().add(this.lastDirection));
        }
        segment.rotation.z = index * 0.03; // Add slight rotation for interesting effect
        
        // Add to scene and store reference
        this.scene.add(segment);
        this.lastSegmentId = segment.userData.id;
        return segment;
    }

    createTunnel() {
        // Generate initial tunnel segments along a curved path
        for (let i = 0; i < this.maxSegments; i++) {
            // Calculate position along path
            const position = this.getPathPoint(i);
            
            // Update direction vector (normalized)
            if (i > 0) {
                this.lastDirection = new THREE.Vector3()
                    .subVectors(position, this.lastPosition)
                    .normalize();
            }
            
            // Create segment and add to array
            const segment = this.createTunnelSegment(position, i);
            this.tunnelSegments.push(segment);
            this.lastPosition.copy(position);
            
            // Update path index
            this.pathIndex = i;
        }
    }

    updateTunnel() {
        // Speed of travel
        const speed = 0.15;
        
        // Temporary array to track segments that need recycling
        const segmentsToRecycle = [];
        
        // Move all segments toward the camera
        this.tunnelSegments.forEach(segment => {
            segment.position.z += speed;
            
            // If segment is behind camera, mark for recycling
            if (segment.position.z > 5) {
                segmentsToRecycle.push(segment);
            }
        });
        
        // Process segments that need recycling
        segmentsToRecycle.forEach(segment => {
            // Get the current last segment as reference
            const lastSegment = this.tunnelSegments[this.tunnelSegments.length - 1];
            
            // Increment path index for next segment
            this.pathIndex += 1;
            
            // Get next position along the infinite path
            const newPosition = this.getPathPoint(this.pathIndex);
            
            // Calculate direction based on the previous point
            const prevPoint = this.getPathPoint(this.pathIndex - 1);
            const direction = new THREE.Vector3()
                .subVectors(newPosition, prevPoint)
                .normalize();
            
            // Update segment
            segment.position.copy(newPosition);
            
            // Ensure proper orientation
            if (direction.lengthSq() > 0) {
                segment.lookAt(newPosition.clone().add(direction));
            }
            
            // Update segment radius for variety
            const radiusSegment = this.tunnelRadius * (1 + this.noise(this.pathIndex * 0.1) * this.tunnelVariation);
            // Only create new geometry if necessary to avoid performance issues
            if (Math.abs(segment.geometry.parameters.radius - radiusSegment) > 0.1) {
                segment.geometry.dispose(); // Clean up old geometry
                segment.geometry = new THREE.TorusGeometry(radiusSegment, 0.2, 8, 30);
            }
            
            // Update color
            const color = new THREE.Color();
            color.setHSL(this.pathIndex % 10 / 10, 1, 0.5);
            segment.material.color = color;
            segment.material.emissive = color;
            
            // Rotate segment for added effect
            segment.rotation.z = this.pathIndex * 0.03;
            
            // Update the ID for tracking
            segment.userData.id = this.segmentCounter++;
            this.lastSegmentId = segment.userData.id;
            
            // Move to end of array (FIFO)
            this.tunnelSegments.splice(this.tunnelSegments.indexOf(segment), 1);
            this.tunnelSegments.push(segment);
        });
        
        // Increment noise offset for animation over time
        this.noiseOffset += this.noiseSpeed;
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