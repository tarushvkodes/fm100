document.addEventListener('DOMContentLoaded', function() {
    const colorContainer = document.querySelector('.color-container');
    const colorTiles = document.querySelectorAll('.color-tile');
    
    // Exit if no tiles are found
    if (colorTiles.length === 0) {
        console.error('No color tiles found! Creating sample tiles for testing...');
        createSampleTiles();
    }
    
    // Convert container to X-Rite style
    styleContainerAsXrite();
    
    let draggedTile = null;
    let dragStartX, dragStartY;
    let initialX, initialY;
    let isTouchDevice = false;
    let correctOrder = [];
    
    // Create 100 sample tiles (only if none exist)
    function createSampleTiles() {
        colorContainer.innerHTML = ''; // Clear container
        
        // Create color gradient with 100 steps (including first and last)
        const totalTiles = 100;
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.classList.add('color-tile');
            tile.setAttribute('data-position', i);
            
            // Create a color gradient (simplified version of FM100)
            // This creates a full hue circle in HSL color space
            const hue = Math.floor((i / totalTiles) * 360);
            const saturation = 100;
            const lightness = 50;
            
            tile.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            colorContainer.appendChild(tile);
        }
        
        // Refresh the colorTiles NodeList
        return document.querySelectorAll('.color-tile');
    }
    
    // Style container to look like X-Rite test
    function styleContainerAsXrite() {
        // Add X-Rite styling
        const xriteStyle = document.createElement('style');
        xriteStyle.textContent = `
            .color-container {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                border-radius: 8px;
                background-color: #f0f0f0;
                box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                min-height: 100px;
            }
            
            .color-tile {
                width: 40px;
                height: 40px;
                margin: 3px;
                border-radius: 4px;
                cursor: move; /* Fallback for older browsers */
                cursor: grab;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                display: inline-block;
                transition: transform 0.1s;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                touch-action: none;
                -webkit-touch-callout: none;
                position: relative;
                z-index: 1;
            }
            
            /* Updated landscape mode styling */
            @media (orientation: landscape) {
                .color-container {
                    max-width: 100%;
                    width: 100vw;
                    height: auto;
                    min-height: 80vh;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(46px, 46px));
                    gap: 3px;
                    justify-content: center;
                    align-content: flex-start;
                    padding: 10px;
                    padding-bottom: 100px;
                    margin: 0;
                }
                
                .color-tile {
                    position: static !important;
                    display: block !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    margin: 0;
                    width: 40px;
                    height: 40px;
                }
                
                .dragging {
                    position: fixed !important;
                }
            }
            
            /* Fix for text selection during drag */
            body {
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                overflow-x: hidden;
            }
            
            .color-tile:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .locked-tile {
                border: 3px solid #FFD700 !important;
                box-shadow: 0 0 8px #FFD700;
                position: relative !important;
                z-index: 5 !important;
            }
            
            .placeholder {
                background-color: #ddd !important;
                border: 2px dashed #999;
                box-shadow: none;
                opacity: 0.7;
                width: 40px;
                height: 40px;
                margin: 3px;
                border-radius: 4px;
                display: inline-block;
            }
            
            #score-display {
                background-color: #333 !important;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: 'Arial', sans-serif;
                font-size: 18px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                text-align: center;
            }
            
            .dragging {
                cursor: grabbing !important;
                opacity: 0.8;
                transform: scale(1.1);
                z-index: 1000;
            }
            
            /* X-Rite style title */
            .test-title {
                font-family: 'Arial', sans-serif;
                text-align: center;
                font-weight: bold;
                margin-bottom: 20px;
                color: #333;
            }
            
            /* Instructions */
            .test-instructions {
                font-family: 'Arial', sans-serif;
                text-align: center;
                margin-bottom: 20px;
                color: #555;
                padding: 0 40px;
            }
        `;
        document.head.appendChild(xriteStyle);
        
        // Add title and instructions like X-Rite
        if (!document.querySelector('.test-title')) {
            const title = document.createElement('h1');
            title.classList.add('test-title');
            title.textContent = "Farnsworth-Munsell 100 Hue Test";
            document.body.insertBefore(title, colorContainer);
            
            const instructions = document.createElement('p');
            instructions.classList.add('test-instructions');
            instructions.textContent = "Arrange the color tiles in order of hue from left to right. The first and last tiles are fixed in place.";
            document.body.insertBefore(instructions, colorContainer);
        }
    }
    
    // Ensure color tiles are visible with explicit styling and prevent text selection
    function setupTiles() {
        colorTiles.forEach(tile => {
            // Force draggable attribute
            tile.setAttribute('draggable', 'true');
            
            // Add specific drag handle class for touch
            tile.classList.add('drag-handle');
            
            // Enforce visibility and sizing
            tile.style.width = '40px';
            tile.style.height = '40px';
            tile.style.display = 'inline-block';
            tile.style.visibility = 'visible';
            tile.style.margin = '3px';
            tile.style.borderRadius = '4px';
            
            // Prevent text selection
            tile.style.userSelect = 'none';
            tile.style.webkitUserSelect = 'none';
            tile.style.mozUserSelect = 'none';
            tile.style.msUserSelect = 'none';
            tile.style.touchAction = 'none';
            tile.style.webkitTouchCallout = 'none';
            
            // Set cursor style
            tile.style.cursor = 'move'; // Fallback
            tile.style.cursor = 'grab';
            
            // Add direct drag indicator
            const dragIndicator = document.createElement('div');
            dragIndicator.style.position = 'absolute';
            dragIndicator.style.top = '50%';
            dragIndicator.style.left = '50%';
            dragIndicator.style.transform = 'translate(-50%, -50%)';
            dragIndicator.style.opacity = '0.7';
            dragIndicator.style.fontSize = '18px';
            dragIndicator.style.display = 'none'; // Hidden by default
            dragIndicator.innerHTML = '⇄';
            dragIndicator.classList.add('drag-indicator');
            
            tile.addEventListener('mouseenter', () => {
                if (!tile.classList.contains('locked-tile')) {
                    dragIndicator.style.display = 'block';
                }
            });
            
            tile.addEventListener('mouseleave', () => {
                dragIndicator.style.display = 'none';
            });
            
            tile.appendChild(dragIndicator);
            
            // If no background color is set, give it a default
            if (!tile.style.backgroundColor) {
                const index = Array.from(colorTiles).indexOf(tile);
                const hue = Math.floor((index / colorTiles.length) * 360);
                tile.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
            }
            
            // Ensure draggability
            tile.setAttribute('draggable', 'true');
            
            // Add Apple Pencil support
            tile.addEventListener('pointerdown', handlePointerDown);
            tile.addEventListener('pointermove', handlePointerMove);
            tile.addEventListener('pointerup', handlePointerUp);
            tile.addEventListener('pointercancel', handlePointerUp);
            
            // Enable pointer capture
            tile.style.touchAction = 'none';
        });
        
        // Output debug info
        console.log('Tiles set up with draggable attribute:', 
            Array.from(colorTiles).every(tile => tile.getAttribute('draggable') === 'true'));
    }

    // Add Apple Pencil handlers
    function handlePointerDown(e) {
        if (this.classList.contains('locked-tile')) return;
        
        // Check if input is pen/pencil
        if (e.pointerType === 'pen') {
            e.preventDefault();
            draggedTile = this;
            this.classList.add('dragging');
            this.classList.add('pencil-drag');
            
            // Store initial position
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            initialX = this.offsetLeft;
            initialY = this.offsetTop;
            
            // Capture pointer events
            this.setPointerCapture(e.pointerId);
        }
    }

    function handlePointerMove(e) {
        if (!draggedTile || e.pointerType !== 'pen') return;
        
        const touch = e.touches[0];
        const containerRect = colorContainer.getBoundingClientRect();
        
        // Adjust for orientation and scroll
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Position the tile absolutely for dragging
        draggedTile.style.position = 'absolute';
        draggedTile.style.left = `${touch.clientX - dragStartX + initialX - containerRect.left + scrollX}px`;
        draggedTile.style.top = `${touch.clientY - dragStartY + initialY - containerRect.top + scrollY}px`;
        draggedTile.style.zIndex = '1000'; // Ensure dragged tile is on top
        
        // Find the drop position with an expanded hitbox
        const hitboxSize = 30; // Larger hitbox for easier touch targeting
        const afterElement = getDragAfterElement(
            colorContainer, 
            touch.clientY, 
            touch.clientX,
            hitboxSize
        );
        
        if (afterElement) {
            // Don't position after the last locked tile
            const lastElement = correctOrder[correctOrder.length - 1].element;
            if (afterElement !== lastElement) {
                const placeholder = document.querySelector('.placeholder');
                if (placeholder) {
                    colorContainer.insertBefore(placeholder, afterElement);
                }
            }
        } else {
            // Don't append if it would make it come after the last tile
            const lastElement = correctOrder[correctOrder.length - 1].element;
            const placeholder = document.querySelector('.placeholder');
            if (placeholder && lastElement && lastElement.previousElementSibling !== placeholder) {
                colorContainer.insertBefore(placeholder, lastElement);
            }
        }
        
        e.preventDefault(); // Prevent scrolling during drag
    }
    
    // Updated orientation adjustment function
    function adjustForOrientation() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        console.log('Adjusting for orientation:', isLandscape ? 'landscape' : 'portrait');
        
        if (isLandscape) {
            colorContainer.style.display = 'grid';
            colorContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(46px, 46px))';
            colorContainer.style.maxWidth = '100%';
            colorContainer.style.width = '100vw';
            colorContainer.style.margin = '0';
            colorContainer.style.padding = '10px';
            colorContainer.style.paddingBottom = '100px';
            colorContainer.style.justifyContent = 'center';
            colorContainer.style.alignContent = 'start';
            
            // Ensure tiles are visible and properly positioned
            colorTiles.forEach(tile => {
                tile.style.position = 'static';
                tile.style.display = 'block';
                tile.style.visibility = 'visible';
                tile.style.opacity = '1';
                tile.style.margin = '0';
                tile.style.width = '40px';
                tile.style.height = '40px';
            });
        } else {
            colorContainer.style.display = 'flex';
            colorContainer.style.flexWrap = 'wrap';
            colorContainer.style.maxWidth = '800px';
            colorContainer.style.margin = '0 auto';
            colorContainer.style.padding = '20px';
            
            colorTiles.forEach(tile => {
                tile.style.position = '';
                tile.style.margin = '3px';
            });
        }
        
        // Force layout recalculation
        colorContainer.offsetHeight; // Trigger reflow
    }

    // Updated lockEndTiles function to position locked tiles in opposite corners
    function lockEndTiles() {
        const firstTile = correctOrder[0].element;
        const lastTile = correctOrder[correctOrder.length - 1].element;
        
        // Add a special class to visually indicate locked tiles
        firstTile.classList.add('locked-tile');
        lastTile.classList.add('locked-tile');
        
        // Make them non-draggable
        firstTile.setAttribute('draggable', false);
        lastTile.setAttribute('draggable', false);
        
        // Position first tile in the top-left corner
        firstTile.style.gridColumn = '1';
        firstTile.style.gridRow = '1';
        
        // Position last tile in the bottom-right corner
        const columns = Math.floor(colorContainer.offsetWidth / 46); // Approximate column count
        const rows = Math.ceil(colorTiles.length / columns); // Approximate row count
        lastTile.style.gridColumn = `${columns}`;
        lastTile.style.gridRow = `${rows}`;
        
        // Ensure they are added to the container
        if (colorContainer.firstChild !== firstTile) {
            colorContainer.insertBefore(firstTile, colorContainer.firstChild);
        }
        if (colorContainer.lastChild !== lastTile) {
            colorContainer.appendChild(lastTile);
        }
    }

    // Enhanced iPad-specific initialization
    function initializeIPadSupport() {
        // Add meta tag to prevent unwanted behaviors
        let meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        document.head.appendChild(meta);
        
        // Add meta for orientation support
        let orientationMeta = document.createElement('meta');
        orientationMeta.name = 'orientation';
        orientationMeta.content = 'portrait, landscape';
        document.head.appendChild(orientationMeta);
        
        // Prevent default touch actions on the container and document
        [colorContainer, document.body].forEach(el => {
            el.addEventListener('touchmove', function(e) {
                if (draggedTile) {
                    e.preventDefault();
                }
            }, { passive: false });
        });
        
        // Prevent Safari's callout feature
        document.body.style.webkitTouchCallout = 'none';
        
        // Add CSS for iOS Safari specific fixes
        const iosFixes = document.createElement('style');
        iosFixes.textContent = `
            /* iOS Safari specific fixes */
            @supports (-webkit-touch-callout: none) {
                .color-tile {
                    /* Prevent gray flash when tapping */
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* Fix for landscape mode */
                @media (orientation: landscape) {
                    .color-container {
                        padding-bottom: 60px; /* Add padding for iOS home indicator */
                    }
                }
            }
        `;
        document.head.appendChild(iosFixes);
        
        // Ensure draggable works even after DOM changes
        setInterval(() => {
            colorTiles.forEach(tile => {
                if (!tile.classList.contains('locked-tile') && tile.getAttribute('draggable') !== 'true') {
                    tile.setAttribute('draggable', 'true');
                }
            });
        }, 1000);
    }

    // Initialize iPad support
    initializeIPadSupport();

    // Call initial orientation adjustment and lock tiles
    adjustForOrientation();
    lockEndTiles();

    // Re-adjust layout on orientation change
    window.addEventListener('orientationchange', function() {
        console.log('Orientation changed');
        setTimeout(() => {
            adjustForOrientation();
            lockEndTiles();
        }, 300); // Allow time for orientation change to settle
    });

    // Call lockEndTiles after layout adjustments
    window.addEventListener('resize', function() {
        setTimeout(() => {
            adjustForOrientation();
            lockEndTiles();
        }, 300);
    });
});
