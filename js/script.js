// Import Three.js using ES modules
import * as THREE from 'three';

// Configuration
const config = {
    gridSize: { x: 40, z: 40 },        // Number of models in grid (x, z)
    spacing: 1.0,                     // Spacing between models
    pyramidSize: 1.0,                 // Base size of pyramids
    pyramidHeight: 2.0,               // Height of pyramids
    tipMovementFactor: 0.5,           // How far the tip can move (as fraction of base size)
    mouseInfluenceRadius: 40,          // How far the mouse influence reaches
    modelColor: 0xcccccc,             // Base color of models
    highlightColor: 0xffffff,         // Highlight color when mouse is near
};

// Variables
let scene, camera, renderer;
let models = [];
let mousePosition = new THREE.Vector2(0, 0);
let raycaster = new THREE.Raycaster();

// Initialize the scene
function init() {
    console.log('Initializing scene');
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Dark gray background
    
    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    console.log('Added ambient light');
    
    // Add directional lights from multiple angles for better visibility
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(5, 10, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, 10, -10);
    scene.add(directionalLight3);
    
    // Add a visible ground plane for better orientation
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -0.01; // Slightly below the pyramids
    scene.add(ground);
    
    // Create a camera with a better position
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
    camera.position.set(0, 15, 20); // Higher up and further back
    camera.lookAt(0, 0, 0);
    
    // Create the renderer with alpha for transparency
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1); // Clear with black, fully opaque
    
    // Add the renderer to the DOM
    const container = document.getElementById('interactive-background');
    if (container) {
        container.appendChild(renderer.domElement);
        console.log('Added renderer to DOM');
    } else {
        console.error('Could not find #interactive-background element');
        document.body.appendChild(renderer.domElement);
        console.log('Added renderer directly to body as fallback');
    }
    
    // Create grid of pyramids with custom geometry
    createPyramidGrid();
    
    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove);
}

// Create a grid of custom pyramids with movable tips
function createPyramidGrid() {
    console.log('Creating pyramid grid');
    const { x: gridX, z: gridZ } = config.gridSize;
    const halfGridX = (gridX - 1) * config.spacing / 2;
    const halfGridZ = (gridZ - 1) * config.spacing / 2;
    
    // Create pyramids in a grid pattern
    for (let x = 0; x < gridX; x++) {
        for (let z = 0; z < gridZ; z++) {
            // Calculate position
            const posX = (x * config.spacing) - halfGridX;
            const posZ = (z * config.spacing) - halfGridZ;
            
            // Create a custom pyramid with vertices we can manipulate
            const pyramid = createCustomPyramid(posX, posZ);
            
            // Add to scene and store reference
            scene.add(pyramid);
            models.push(pyramid);
        }
    }
    console.log(`Created ${models.length} pyramids in the grid`);
}

// Create a custom pyramid with vertices we can manipulate
function createCustomPyramid(x, z) {
    // Create geometry with 5 vertices (4 for base, 1 for tip)
    const geometry = new THREE.BufferGeometry();
    
    // Half the size of the base
    const halfSize = config.pyramidSize / 2;
    
    // Define the 5 vertices (base vertices and tip)
    const vertices = new Float32Array([
        // Base vertices (square at y=0)
        x - halfSize, 0, z - halfSize,  // bottom left
        x + halfSize, 0, z - halfSize,  // bottom right
        x + halfSize, 0, z + halfSize,  // top right
        x - halfSize, 0, z + halfSize,  // top left
        
        // Tip (will be animated)
        x, config.pyramidHeight, z      // tip
    ]);
    
    // Define the faces (triangles)
    const indices = [
        // Base square (2 triangles)
        0, 1, 3,
        1, 2, 3,
        
        // Four triangular faces
        0, 4, 1,  // front face
        1, 4, 2,  // right face
        2, 4, 3,  // back face
        3, 4, 0   // left face
    ];
    
    // Set the vertices and indices to the geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    
    // Calculate vertex normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create material with shading
    const material = new THREE.MeshPhongMaterial({
        color: config.modelColor,
        shininess: 30,
        specular: 0x444444,
        flatShading: false
    });
    
    // Create and return the mesh
    const pyramid = new THREE.Mesh(geometry, material);
    
    // Store original tip position and other metadata
    pyramid.userData = {
        baseX: x,
        baseZ: z,
        tipIndex: 4,  // Index of the tip vertex (5th vertex)
        originalTipY: config.pyramidHeight,
        originalColor: config.modelColor
    };
    
    return pyramid;
}

// Update function called on each frame
function update() {
    // Cast a ray from the camera through the mouse position
    raycaster.setFromCamera(mousePosition, camera);
    
    // Calculate a 3D point in the scene from mouse coordinates
    const planeY = 0; // Y position of the plane to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, targetPoint);
    
    // Update each pyramid's tip position based on mouse location
    models.forEach(pyramid => {
        // Get the current vertex positions
        const positions = pyramid.geometry.attributes.position.array;
        
        // Get base center position
        const baseX = pyramid.userData.baseX;
        const baseZ = pyramid.userData.baseZ;
        
        // Calculate vector from base center to mouse target
        const vectorToTarget = new THREE.Vector2(
            targetPoint.x - baseX,
            targetPoint.z - baseZ
        );
        
        // Calculate distance for intensity effect
        const distance = vectorToTarget.length();
        const influence = Math.max(0, 1 - (distance / config.mouseInfluenceRadius));
        
        // Calculate tip offset based on mouse influence
        const maxOffset = config.pyramidSize * config.tipMovementFactor;
        let tipOffsetX = 0;
        let tipOffsetZ = 0;
        
        if (distance > 0) {
            // Normalize and scale the vector
            vectorToTarget.normalize();
            tipOffsetX = vectorToTarget.x * maxOffset * influence;
            tipOffsetZ = vectorToTarget.y * maxOffset * influence;
        }
        
        // Update the tip position (5th vertex, index 4, xyz coordinates)
        const tipIndex = pyramid.userData.tipIndex * 3; // Multiply by 3 for x,y,z components
        positions[tipIndex] = baseX + tipOffsetX;
        positions[tipIndex + 1] = pyramid.userData.originalTipY;
        positions[tipIndex + 2] = baseZ + tipOffsetZ;
        
        // Mark the positions attribute as needing update
        pyramid.geometry.attributes.position.needsUpdate = true;
        
        // Update geometry attributes
        pyramid.geometry.computeVertexNormals();
        
        // Update material color based on distance
        const baseColor = new THREE.Color(config.modelColor);
        const highlightColor = new THREE.Color(config.highlightColor);
        const color = baseColor.clone().lerp(highlightColor, influence);
        
        // Apply color
        pyramid.material.color.copy(color);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement
function onMouseMove(event) {
    // Calculate normalized mouse position (-1 to 1)
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Handle touch movement for mobile devices
function onTouchMove(event) {
    if (event.touches.length > 0) {
        // Calculate normalized touch position (-1 to 1)
        mousePosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mousePosition.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        
        event.preventDefault();
    }
}

// Initialize and start animation once page is loaded
// Using this instead of DOMContentLoaded since ES modules are already deferred
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM already loaded, run init directly
    init();
}
animate();