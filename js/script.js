// Import Three.js using ES modules
import * as THREE from 'three';

// Configuration
const config = {
    gridSize: { x: 40, z: 40 },        // Number of models in grid (x, z)
    spacing: 1.0,                     // Spacing between models
    pyramidSize: 1.0,                 // Base size of pyramids
    pyramidHeight: 2.0,               // Height of pyramids
    tipMovementFactor: 0.5,           // How far the tip can move (as fraction of base size)
    mouseInfluenceRadius: 40,         // How far the mouse influence reaches
    modelColor: 0xcccccc,             // Base color of models
    maxStretchFactor: 1.6,            // Maximum factor by which pyramids can stretch (1.0 = no stretch)
    minHeightFactor: 1.0,             // Minimum height factor (no compression)
    stretchTransitionFactor: 0.7      // Controls the smoothness of the stretch transition (higher = more gradual)
};

// Variables
let scene, camera, renderer;
let models = [];
let mousePosition = new THREE.Vector2(0, 0);
let raycaster = new THREE.Raycaster();
// Add a variable to store fixed lights
let lights = [];

// Add a variable to store current base color
let currentBaseColor = config.modelColor;

// Pantone color palette (hex values)
const pantoneColors = [
    0xD94F70,  // Pantone 18-2043 - Raspberry Sorbet
    0xFF6F61,  // Pantone 16-1546 - Living Coral (2019 Color of the Year)
    0xFFBF00,  // Pantone 14-1064 - Marigold
    0x7FBFB4,  // Pantone 14-5413 - Turquoise
    0x88B04B,  // Pantone 15-0343 - Greenery (2017 Color of the Year)
    0x5F4B8B,  // Pantone 18-3838 - Ultra Violet (2018 Color of the Year)
    0x0F4C81,  // Pantone 19-4052 - Classic Blue (2020 Color of the Year)
    0x939597,  // Pantone 17-5104 - Ultimate Gray (2021 Color of the Year)
    0xF5DF4D,  // Pantone 13-0647 - Illuminating (2021 Color of the Year)
    0x006B54,  // Pantone 18-5845 - Forest Biome
    0x765285,  // Pantone 18-3224 - Very Peri (2022 Color of the Year)
    0xDC793E,  // Pantone 18-1750 - Viva Magenta (2023 Color of the Year)
    0x9CCEA9,  // Pantone 13-1023 - Peach Fuzz (2024 Color of the Year)
    0xFADA5E,  // Pantone 12-0752 - Meadowlark
    0xBC243C,  // Pantone 19-1662 - True Red
    0x5A5B9F,  // Pantone 18-3949 - Blue Iris
    0x6667AB,  // Pantone 16-4535 - Serenity
    0xF7CAC9,  // Pantone 13-1520 - Rose Quartz
    0xA2B2C8,  // Pantone 15-3920 - Serenity
    0x91A8D0,  // Pantone 15-3919 - Serenity
    0x9B1B30,  // Pantone 19-1764 - Crimson
    0x5B5EA6,  // Pantone 18-3838 - Violet
    0x00B5E2,  // Pantone 14-4811 - Blue Atoll
    0x00B388,  // Pantone 15-5421 - Arcadia
    0x009473,  // Pantone 17-5641 - Emerald
    0x844C9C,  // Pantone 17-3628 - Purple
    0xD65076,  // Pantone 17-2031 - Pink Yarrow
    0xEFC050,  // Pantone 14-0846 - Primrose Yellow
    0x98C1D9,  // Pantone 15-3717 - Placid Blue
    0x9CD7D3   // Pantone 14-4620 - Island Paradise
];

// Function to get a random Pantone color from our palette
function getRandomPantoneColor() {
    // Get random index
    const randomIndex = Math.floor(Math.random() * pantoneColors.length);
    
    // Return the color at that index
    return pantoneColors[randomIndex];
}

// Function to change all pyramids to a new random color
function changeColor() {
    // Generate a new random color from the Pantone palette
    currentBaseColor = getRandomPantoneColor();
    
    // Update config color
    config.modelColor = currentBaseColor;
    
    // Update each pyramid's base color
    models.forEach(pyramid => {
        pyramid.userData.originalColor = currentBaseColor;
    });
}

// Setup fixed lighting in the scene
function setupLighting() {
    // Add ambient light with increased intensity
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);
    console.log('Added fixed ambient light');
    
    // Add fixed directional lights from multiple angles for better visibility
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);
    lights.push(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 8, -5);
    directionalLight2.castShadow = true;
    scene.add(directionalLight2);
    lights.push(directionalLight2);
    
    // Add a third light from directly above for consistent illumination
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, 15, 0);  // Directly above
    directionalLight3.castShadow = true;
    scene.add(directionalLight3);
    lights.push(directionalLight3);
    
    // Add a fourth light from below for some interesting shadows
    const directionalLight4 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight4.position.set(0, -5, 0);  // Below
    scene.add(directionalLight4);
    lights.push(directionalLight4);
    
    console.log('Added fixed directional lights');
}

// Initialize the scene
function init() {
    console.log('Initializing scene');
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Dark gray background
    
    // Setup fixed lighting
    setupLighting();
    
    // Add a visible ground plane for better orientation
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.8, 
        metalness: 0.2,
        receiveShadow: true
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
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
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
        flatShading: false,
        castShadow: true,
        receiveShadow: true
    });
    
    // Create and return the mesh
    const pyramid = new THREE.Mesh(geometry, material);
    
    // Store original tip position and other metadata
    pyramid.userData = {
        baseX: x,
        baseZ: z,
        tipIndex: 4,  // Index of the tip vertex (5th vertex)
        originalTipY: config.pyramidHeight,
        originalColor: config.modelColor,
        originalHeight: config.pyramidHeight  // Store the original height for stretching calculations
    };
    
    return pyramid;
}

// Update function called on each frame
function update() {
    // Cast a ray from the camera through the mouse position
    raycaster.setFromCamera(mousePosition, camera);
    
    // Calculate a 3D point in the scene from mouse coordinates directly
    // No more artificial height projection
    const planeY = 0; // Y position of the ground plane (no upward shift)
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
        
        // Calculate the vector from base to mouse position
        const vectorToTarget = new THREE.Vector2(
            targetPoint.x - baseX,
            targetPoint.z - baseZ
        );
        
        // Calculate distance for influence effect
        const distance = vectorToTarget.length();
        
        // Create a more gradual influence falloff using a smoother curve
        // This creates a more gradual transition between affected and unaffected pyramids
        const smoothFactor = config.stretchTransitionFactor; // Controls curve steepness
        const normalizedDistance = distance / config.mouseInfluenceRadius;
        // Smooth falloff function
        const influence = Math.max(0, 1 - Math.pow(normalizedDistance, smoothFactor));
        
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
        
        // Calculate stretch factor based on distance with a smoother transition
        // We use the same smoothed influence to affect the stretching
        // This creates a more gradual and natural wave-like effect
        let stretchFactor = 1.0;
        
        if (influence > 0) {
            // Apply a smoother stretching curve
            // Square root function creates a more gradual initial rise
            stretchFactor = 1.0 + (config.maxStretchFactor - 1.0) * Math.sqrt(influence);
        }
        
        // Apply stretch factor to tip height (y-coordinate)
        const stretchedHeight = pyramid.userData.originalHeight * stretchFactor;
        
        // Update the tip position (5th vertex, index 4, xyz coordinates)
        const tipIndex = pyramid.userData.tipIndex * 3; // Multiply by 3 for x,y,z components
        positions[tipIndex] = baseX + tipOffsetX;
        positions[tipIndex + 1] = stretchedHeight; // Apply the stretched height
        positions[tipIndex + 2] = baseZ + tipOffsetZ;
        
        // Mark the positions attribute as needing update
        pyramid.geometry.attributes.position.needsUpdate = true;
        
        // Update geometry attributes
        pyramid.geometry.computeVertexNormals();
        
        // No color change based on mouse position - just use the current base color
        pyramid.material.color.set(pyramid.userData.originalColor || currentBaseColor);
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