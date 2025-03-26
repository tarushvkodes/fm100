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
            }
            
            /* Fixed positioning in landscape mode */
            @media (orientation: landscape) {
                .color-container {
                    max-width: 90vw;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                #score-display {
                    position: fixed !important;
                    top: 20px !important;
                    right: 20px !important;
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
        });
        
        // Output debug info
        console.log('Tiles set up with draggable attribute:', 
            Array.from(colorTiles).every(tile => tile.getAttribute('draggable') === 'true'));
    }
    
    // Call the setup function
    setupTiles();
    
    // For orientation changes
    window.addEventListener('orientationchange', function() {
        console.log('Orientation changed');
        // Re-initialize the layout after orientation change
        setTimeout(() => {
            setupTiles();
            adjustForOrientation();
        }, 300);
    });
    
    // Handle orientation adjustments
    function adjustForOrientation() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        console.log('Adjusting for orientation:', isLandscape ? 'landscape' : 'portrait');
        
        if (isLandscape) {
            // Adjust for landscape mode
            colorContainer.style.maxWidth = '90vw';
        } else {
            // Reset for portrait mode
            colorContainer.style.maxWidth = '800px';
        }
    }
    
    // Call initial orientation adjustment
    adjustForOrientation();
    
    // Generate correct order based on tile data for scoring
    function initializeCorrectOrder() {
        // Clear previous order
        correctOrder = [];
        
        // Extract tiles and their color values
        const tiles = [...colorTiles];
        
        // Store original positions if data attributes exist
        tiles.forEach((tile, index) => {
            // Add a data attribute for original position if not present
            if (!tile.hasAttribute('data-position')) {
                tile.setAttribute('data-position', index);
            }
            
            correctOrder.push({
                element: tile,
                position: parseInt(tile.getAttribute('data-position'))
            });
        });
        
        // Sort by correct position
        correctOrder.sort((a, b) => a.position - b.position);
        
        // Randomize tiles except first and last
        scrambleTiles();
    }
    
    // Scramble the tiles for the test, keeping first and last in place
    function scrambleTiles() {
        const allTiles = Array.from(colorTiles);
        const firstTile = correctOrder[0].element;
        const lastTile = correctOrder[correctOrder.length - 1].element;
        
        // Remove fixed tiles from array
        const tilesForScrambling = allTiles.filter(
            tile => tile !== firstTile && tile !== lastTile
        );
        
        // Fisher-Yates shuffle
        for (let i = tilesForScrambling.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tilesForScrambling[i], tilesForScrambling[j]] = 
            [tilesForScrambling[j], tilesForScrambling[i]];
        }
        
        // Clear container
        colorContainer.innerHTML = '';
        
        // Add first tile
        colorContainer.appendChild(firstTile);
        
        // Add scrambled tiles
        tilesForScrambling.forEach(tile => {
            colorContainer.appendChild(tile);
        });
        
        // Add last tile
        colorContainer.appendChild(lastTile);
    }
    
    // Initialize correct order
    initializeCorrectOrder();
    
    // Lock first and last tiles to their correct positions in the grid
    function lockEndTiles() {
        const firstTile = correctOrder[0].element;
        const lastTile = correctOrder[correctOrder.length - 1].element;
        
        // Add a special class to visually indicate locked tiles
        firstTile.classList.add('locked-tile');
        lastTile.classList.add('locked-tile');
        
        // Make them non-draggable
        firstTile.setAttribute('draggable', false);
        lastTile.setAttribute('draggable', false);
        
        // Make sure they're at the start and end
        if (colorContainer.firstChild !== firstTile) {
            colorContainer.insertBefore(firstTile, colorContainer.firstChild);
        }
        
        if (colorContainer.lastChild !== lastTile) {
            colorContainer.appendChild(lastTile);
        }
    }
    
    // Allow the DOM to settle before locking end tiles
    setTimeout(lockEndTiles, 100);
    
    // Initialize each tile with enhanced drag events
    colorTiles.forEach(tile => {
        // Prevent default behaviors that might interfere with dragging
        ['mousedown', 'touchstart'].forEach(eventName => {
            tile.addEventListener(eventName, function(e) {
                if (!this.classList.contains('locked-tile')) {
                    console.log(`${eventName} on tile`);
                    e.preventDefault();
                }
            });
        });
        
        // When drag starts - enhanced handling
        tile.addEventListener('dragstart', function(e) {
            if (this.classList.contains('locked-tile')) {
                e.preventDefault();
                return;
            }
            
            console.log('Drag started');
            this.classList.add('dragging');
            
            // Use a better drag image that's visible
            try {
                // Create a clone of the tile for the drag image
                const dragImage = this.cloneNode(true);
                dragImage.style.opacity = '0.8';
                dragImage.style.transform = 'scale(1.2)';
                document.body.appendChild(dragImage);
                
                // Set it as the drag image, then remove it
                e.dataTransfer.setDragImage(dragImage, 20, 20);
                setTimeout(() => {
                    document.body.removeChild(dragImage);
                }, 0);
            } catch (error) {
                console.warn('Drag image failed, using default', error);
                // Fallback to transparent image if clone fails
                const img = new Image();
                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                e.dataTransfer.setDragImage(img, 0, 0);
            }
            
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
            e.dataTransfer.effectAllowed = 'move';
            
            setTimeout(() => {
                this.style.opacity = '0.4';
            }, 0);
        });
        
        // Mouse-based dragging (alternative to HTML5 drag)
        let isDragging = false;
        let startX, startY;
        
        tile.addEventListener('mousedown', function(e) {
            if (this.classList.contains('locked-tile')) return;
            
            // Begin mouse drag
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            this.style.cursor = 'grabbing';
            this.classList.add('dragging');
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const currentTile = document.querySelector('.dragging');
            if (!currentTile) {
                isDragging = false;
                return;
            }
            
            e.preventDefault();
            
            // Move the element
            currentTile.style.position = 'absolute';
            currentTile.style.left = `${e.clientX - startX + currentTile.offsetLeft}px`;
            currentTile.style.top = `${e.clientY - startY + currentTile.offsetTop}px`;
            currentTile.style.zIndex = '1000';
            
            // Find position for insertion
            const afterElement = getDragAfterElement(colorContainer, e.clientY, e.clientX);
            if (afterElement) {
                const lastElement = correctOrder[correctOrder.length - 1].element;
                if (afterElement !== lastElement) {
                    colorContainer.insertBefore(currentTile, afterElement);
                }
            } else {
                const lastElement = correctOrder[correctOrder.length - 1].element;
                if (lastElement.previousElementSibling !== currentTile) {
                    colorContainer.insertBefore(currentTile, lastElement);
                }
            }
            
            // Update drag start positions
            startX = e.clientX;
            startY = e.clientY;
        });
        
        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            
            const currentTile = document.querySelector('.dragging');
            if (currentTile) {
                currentTile.style.position = '';
                currentTile.style.left = '';
                currentTile.style.top = '';
                currentTile.style.zIndex = '';
                currentTile.style.cursor = 'grab';
                currentTile.classList.remove('dragging');
                calculateScore();
            }
            
            isDragging = false;
        });
        
        // When drag ends
        tile.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            this.style.opacity = '1';
            calculateScore();
        });
        
        // Enhanced touch events for better iPad support in any orientation
        tile.addEventListener('touchstart', function(e) {
            if (this.classList.contains('locked-tile')) {
                return; // Don't prevent default for locked tiles
            }
            
            console.log('Touch start on tile');
            
            // Prevent default to stop text selection and browser handling
            e.preventDefault();
            
            isTouchDevice = true;
            draggedTile = this;
            this.classList.add('dragging');
            this.style.opacity = '0.8';
            this.style.cursor = 'grabbing';
            
            const touch = e.touches[0];
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            
            // Save the initial position
            const rect = this.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Create a placeholder to maintain layout during dragging
            createPlaceholder(this);
        }, { passive: false });
        
        tile.addEventListener('touchmove', function(e) {
            if (!draggedTile || this.classList.contains('locked-tile')) return;
            
            // Always prevent default to stop scrolling and text selection
            e.preventDefault();
            
            const touch = e.touches[0];
            const containerRect = colorContainer.getBoundingClientRect();
            
            // Adjust for orientation and scroll
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Position the tile absolutely for dragging
            this.style.position = 'absolute';
            this.style.left = `${touch.clientX - dragStartX + initialX - containerRect.left + scrollX}px`;
            this.style.top = `${touch.clientY - dragStartY + initialY - containerRect.top + scrollY}px`;
            this.style.zIndex = '1000'; // Ensure dragged tile is on top
            
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
        }, { passive: false });
        
        tile.addEventListener('touchend', function(e) {
            if (!draggedTile || this.classList.contains('locked-tile')) return;
            
            // Replace placeholder with actual tile
            const placeholder = document.querySelector('.placeholder');
            if (placeholder) {
                colorContainer.insertBefore(this, placeholder);
                colorContainer.removeChild(placeholder);
            }
            
            // Reset styles
            this.classList.remove('dragging');
            this.style.opacity = '1';
            this.style.position = '';
            this.style.left = '';
            this.style.top = '';
            this.style.zIndex = '';
            
            draggedTile = null;
            
            // Calculate the score after drag ends
            calculateScore();
            
            e.preventDefault();
        }, { passive: false });
        
        // Add touchcancel event to handle unexpected interruptions
        tile.addEventListener('touchcancel', function(e) {
            if (!draggedTile) return;
            
            // Remove placeholder
            const placeholder = document.querySelector('.placeholder');
            if (placeholder) {
                colorContainer.removeChild(placeholder);
            }
            
            // Reset styles
            this.classList.remove('dragging');
            this.style.opacity = '1';
            this.style.position = '';
            this.style.left = '';
            this.style.top = '';
            this.style.zIndex = '';
            
            draggedTile = null;
        }, { passive: false });
    });
    
    // Add a global event listener to prevent unwanted text selection during dragging
    document.addEventListener('selectstart', function(e) {
        if (draggedTile || document.querySelector('.dragging')) {
            e.preventDefault();
        }
    });
    
    // Create a placeholder element to maintain layout during dragging
    function createPlaceholder(element) {
        const placeholder = document.createElement('div');
        placeholder.classList.add('placeholder');
        
        // Match the dimensions of the dragged element
        placeholder.style.width = `${element.offsetWidth}px`;
        placeholder.style.height = `${element.offsetHeight}px`;
        placeholder.style.display = 'inline-block';
        placeholder.style.background = '#f0f0f0';
        placeholder.style.border = '1px dashed #ccc';
        
        // Insert placeholder where the element was
        element.parentNode.insertBefore(placeholder, element);
    }
    
    // Handle the dragover event to determine drop position
    colorContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        console.log('Drag over container');
        
        const draggingTile = document.querySelector('.dragging');
        if (!draggingTile || draggingTile.classList.contains('locked-tile')) return;
        
        const afterElement = getDragAfterElement(colorContainer, e.clientY, e.clientX);
        
        if (afterElement) {
            // Don't position after the last locked tile
            const lastElement = correctOrder[correctOrder.length - 1].element;
            if (afterElement !== lastElement) {
                colorContainer.insertBefore(draggingTile, afterElement);
            }
        } else {
            // Don't append if it would make it come after the last tile
            const lastElement = correctOrder[correctOrder.length - 1].element;
            if (lastElement.previousElementSibling !== draggingTile) {
                colorContainer.insertBefore(draggingTile, lastElement);
            }
        }
    });
    
    // Also handle drop event explicitly
    colorContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        console.log('Drop event on container');
        
        const draggingTile = document.querySelector('.dragging');
        if (draggingTile) {
            draggingTile.classList.remove('dragging');
            draggingTile.style.opacity = '1';
            calculateScore();
        }
    });
    
    // Determine where to place the dragged element with improved hitbox
    function getDragAfterElement(container, y, x, hitboxSize = 0) {
        // Don't consider locked tiles when calculating position
        const draggableElements = [...container.querySelectorAll('.color-tile:not(.dragging):not(.locked-tile), .placeholder')];
        
        // Add first tile to ensure we can't place before it
        const firstElement = correctOrder[0].element;
        if (!draggableElements.includes(firstElement)) {
            draggableElements.unshift(firstElement);
        }
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            
            // Add hitbox expansion for easier touch targeting
            const expandedBox = {
                top: box.top - hitboxSize,
                left: box.left - hitboxSize,
                bottom: box.bottom + hitboxSize,
                right: box.right + hitboxSize,
                width: box.width + hitboxSize * 2,
                height: box.height + hitboxSize * 2
            };
            
            // Use center point of the element
            const offsetY = y - (box.top + box.height / 2);
            const offsetX = x - (box.left + box.width / 2);
            
            // If we're in the same row (Y is close), use X to determine position
            // Otherwise use Y to determine position
            const yThreshold = box.height;
            
            if (Math.abs(offsetY) < yThreshold) {
                // Same row, use X distance
                if (offsetX < 0 && offsetX > closest.offset) {
                    return { offset: offsetX, element: child };
                }
            } else if (offsetY < 0 && offsetY > closest.offset) {
                // Different row, use Y distance
                return { offset: offsetY, element: child };
            }
            
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Calculate the score based on the current order compared to correct order
    function calculateScore() {
        const currentOrder = Array.from(colorContainer.querySelectorAll('.color-tile'));
        let totalError = 0;
        
        // Calculate Total Inversions (TI) - standard method used in FM100 and D15 tests
        for (let i = 0; i < currentOrder.length; i++) {
            const currentPos = parseInt(currentOrder[i].getAttribute('data-position'));
            
            for (let j = i + 1; j < currentOrder.length; j++) {
                const comparisonPos = parseInt(currentOrder[j].getAttribute('data-position'));
                
                // Count inversions (when tiles are out of order)
                if (currentPos > comparisonPos) {
                    totalError++;
                }
            }
        }
        
        // Calculate maximum possible inversions for normalization
        const maxInversions = (correctOrder.length * (correctOrder.length - 1)) / 2;
        
        // Calculate score as percentage of correctness (0-100)
        const score = Math.round(100 * (1 - (totalError / maxInversions)));
        
        // X-Rite style score display
        if (document.getElementById('score-display')) {
            document.getElementById('score-display').innerHTML = `
                <strong>Your Score: ${score}</strong><br>
                <span style="font-size: 14px;">
                    ${getScoreMessage(score)}
                </span>
            `;
        } else {
            const scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'score-display';
            scoreDisplay.innerHTML = `
                <strong>Your Score: ${score}</strong><br>
                <span style="font-size: 14px;">
                    ${getScoreMessage(score)}
                </span>
            `;
            scoreDisplay.style.position = 'fixed';
            scoreDisplay.style.top = '20px';
            scoreDisplay.style.right = '20px';
            scoreDisplay.style.padding = '15px';
            scoreDisplay.style.zIndex = '1000';
            document.body.appendChild(scoreDisplay);
        }
        
        return score;
    }
    
    // Provide score interpretation like X-Rite
    function getScoreMessage(score) {
        if (score >= 95) return "Superior color vision";
        if (score >= 90) return "Normal color vision";
        if (score >= 70) return "Slight color vision deficiency";
        if (score >= 50) return "Moderate color vision deficiency";
        return "Significant color vision deficiency";
    }
    
    // Add reset button like X-Rite
    function addResetButton() {
        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-test';
        resetBtn.textContent = 'Reset Test';
        resetBtn.style.display = 'block';
        resetBtn.style.margin = '20px auto';
        resetBtn.style.padding = '10px 20px';
        resetBtn.style.backgroundColor = '#333';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '4px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.fontFamily = 'Arial, sans-serif';
        
        resetBtn.addEventListener('click', function() {
            scrambleTiles();
            lockEndTiles();
            calculateScore();
        });
        
        // Add after container
        if (!document.getElementById('reset-test')) {
            document.body.insertBefore(resetBtn, colorContainer.nextSibling);
        }
    }
    
    // Add reset button
    setTimeout(addResetButton, 200);
    
    // Add debug overlay button
    function addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-test';
        debugBtn.textContent = 'Toggle Debug Mode';
        debugBtn.style.display = 'block';
        debugBtn.style.margin = '10px auto';
        debugBtn.style.padding = '5px 10px';
        debugBtn.style.backgroundColor = '#999';
        debugBtn.style.color = 'white';
        debugBtn.style.border = 'none';
        debugBtn.style.borderRadius = '4px';
        debugBtn.style.cursor = 'pointer';
        debugBtn.style.fontFamily = 'Arial, sans-serif';
        debugBtn.style.fontSize = '12px';
        
        let debugMode = false;
        
        debugBtn.addEventListener('click', function() {
            debugMode = !debugMode;
            
            if (debugMode) {
                debugBtn.textContent = 'Disable Debug Mode';
                // Add diagnostic information
                colorTiles.forEach(tile => {
                    const debugInfo = document.createElement('span');
                    debugInfo.classList.add('debug-info');
                    debugInfo.textContent = tile.getAttribute('data-position');
                    debugInfo.style.position = 'absolute';
                    debugInfo.style.top = '0';
                    debugInfo.style.left = '0';
                    debugInfo.style.backgroundColor = 'rgba(0,0,0,0.5)';
                    debugInfo.style.color = 'white';
                    debugInfo.style.fontSize = '10px';
                    debugInfo.style.padding = '2px';
                    debugInfo.style.borderRadius = '2px';
                    tile.appendChild(debugInfo);
                    
                    // Highlight draggable status
                    tile.style.border = tile.getAttribute('draggable') === 'true' ? 
                        '2px solid green' : '2px solid red';
                });
                
                // Add container debug info
                const debugContainer = document.createElement('div');
                debugContainer.classList.add('debug-container-info');
                debugContainer.innerHTML = `
                    <div style="position:fixed;left:10px;bottom:10px;background:rgba(0,0,0,0.7);color:white;
                                padding:10px;z-index:9999;font-size:12px;border-radius:4px;">
                        <p>Tiles: ${colorTiles.length} | Draggable: ${document.querySelectorAll('[draggable="true"]').length}</p>
                        <p>Container: ${colorContainer.offsetWidth}x${colorContainer.offsetHeight}</p>
                        <p>Orientation: ${window.matchMedia("(orientation: landscape)").matches ? 'Landscape' : 'Portrait'}</p>
                    </div>
                `;
                document.body.appendChild(debugContainer);
                
            } else {
                debugBtn.textContent = 'Toggle Debug Mode';
                // Remove diagnostic information
                document.querySelectorAll('.debug-info').forEach(el => el.remove());
                document.querySelectorAll('.debug-container-info').forEach(el => el.remove());
                colorTiles.forEach(tile => {
                    tile.style.border = ''; 
                });
            }
        });
        
        // Add after reset button
        const resetBtn = document.getElementById('reset-test');
        if (resetBtn) {
            resetBtn.parentNode.insertBefore(debugBtn, resetBtn.nextSibling);
        } else {
            document.body.insertBefore(debugBtn, colorContainer.nextSibling);
        }
    }
    
    // Add debug button (only in development)
    setTimeout(addDebugButton, 300);
    
    // Calculate initial score after tiles are positioned
    setTimeout(calculateScore, 1000);
    
    // Log diagnostic information
    console.log(`Color tiles found: ${colorTiles.length}`);
    console.log(`Container dimensions: ${colorContainer.offsetWidth}x${colorContainer.offsetHeight}`);
    
    // Alert if no tiles were found initially
    if (colorTiles.length === 0) {
        console.warn('Using sample tiles because no existing tiles were found');
    }
    
    // Enhanced initialization for better iPad support
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
});
