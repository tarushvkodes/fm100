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
            }
            
            .color-tile {
                width: 40px;
                height: 40px;
                margin: 3px;
                border-radius: 4px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                display: inline-block;
                transition: transform 0.1s;
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
    
    // Ensure color tiles are visible with explicit styling
    colorTiles.forEach(tile => {
        // Enforce visibility and sizing
        tile.style.width = '40px';
        tile.style.height = '40px';
        tile.style.display = 'inline-block';
        tile.style.visibility = 'visible';
        tile.style.margin = '3px';
        tile.style.borderRadius = '4px';
        
        // If no background color is set, give it a default
        if (!tile.style.backgroundColor) {
            const index = Array.from(colorTiles).indexOf(tile);
            const hue = Math.floor((index / colorTiles.length) * 360);
            tile.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        }
    });
    
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
    
    // Initialize each tile with drag events
    colorTiles.forEach(tile => {
        // When drag starts
        tile.addEventListener('dragstart', function(e) {
            if (this.classList.contains('locked-tile')) {
                e.preventDefault();
                return;
            }
            
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', ''); // Required for Firefox
            setTimeout(() => {
                this.style.opacity = '0.4';
            }, 0);
        });
        
        // When drag ends
        tile.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            this.style.opacity = '1';
            calculateScore();
        });
        
        // Touch events for mobile support - enhanced for iPad
        tile.addEventListener('touchstart', function(e) {
            if (this.classList.contains('locked-tile')) {
                return; // Don't prevent default for locked tiles to allow scrolling
            }
            
            isTouchDevice = true;
            draggedTile = this;
            this.classList.add('dragging');
            this.style.opacity = '0.8';
            
            const touch = e.touches[0];
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            
            // Save the initial position
            const rect = this.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Create a placeholder to maintain layout during dragging
            createPlaceholder(this);
            
            e.preventDefault(); // Prevent scrolling only for draggable tiles
        }, { passive: false });
        
        tile.addEventListener('touchmove', function(e) {
            if (!draggedTile || this.classList.contains('locked-tile')) return;
            
            const touch = e.touches[0];
            const containerRect = colorContainer.getBoundingClientRect();
            
            // Position the tile absolutely for dragging
            this.style.position = 'absolute';
            this.style.left = `${touch.clientX - dragStartX + initialX - containerRect.left}px`;
            this.style.top = `${touch.clientY - dragStartY + initialY - containerRect.top}px`;
            this.style.zIndex = '1000'; // Ensure dragged tile is on top
            
            // Find the drop position
            const afterElement = getDragAfterElement(colorContainer, touch.clientY, touch.clientX);
            
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
    
    // Determine where to place the dragged element
    function getDragAfterElement(container, y, x) {
        // Don't consider locked tiles when calculating position
        const draggableElements = [...container.querySelectorAll('.color-tile:not(.dragging):not(.locked-tile), .placeholder')];
        
        // Add first tile to ensure we can't place before it
        const firstElement = correctOrder[0].element;
        if (!draggableElements.includes(firstElement)) {
            draggableElements.unshift(firstElement);
        }
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            
            // Use center point of the element
            const offsetY = y - (box.top + box.height / 2);
            
            // For horizontal sorting, prioritize X position
            const offsetX = x - (box.left + box.width / 2);
            
            // If we're in the same row (Y is close), use X to determine position
            // Otherwise use Y to determine position
            const yThreshold = box.height * 0.7;
            
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
    
    // Calculate initial score after tiles are positioned
    setTimeout(calculateScore, 1000);
    
    // Log diagnostic information
    console.log(`Color tiles found: ${colorTiles.length}`);
    console.log(`Container dimensions: ${colorContainer.offsetWidth}x${colorContainer.offsetHeight}`);
    
    // Alert if no tiles were found initially
    if (colorTiles.length === 0) {
        console.warn('Using sample tiles because no existing tiles were found');
    }
});
