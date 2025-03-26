document.addEventListener('DOMContentLoaded', function() {
    const colorContainer = document.querySelector('.color-container');
    const colorTiles = document.querySelectorAll('.color-tile');
    
    let draggedTile = null;
    let dragStartX, dragStartY;
    let initialX, initialY;
    let isTouchDevice = false;
    let correctOrder = [];
    
    // Ensure color tiles are visible with explicit styling
    colorTiles.forEach(tile => {
        tile.style.display = 'inline-block';
        tile.style.visibility = 'visible';
        tile.style.margin = '2px';
    });
    
    // Generate correct order based on tile data for scoring
    function initializeCorrectOrder() {
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
    }
    
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
        
        // Remove these tiles from their current positions
        if (firstTile.parentNode) {
            firstTile.parentNode.removeChild(firstTile);
        }
        if (lastTile.parentNode) {
            lastTile.parentNode.removeChild(lastTile);
        }
        
        // Insert the first tile at the beginning of the container
        colorContainer.insertBefore(firstTile, colorContainer.firstChild);
        
        // Append the last tile at the end of the container
        colorContainer.appendChild(lastTile);
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
            this.style.opacity = '0.4';
            
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
        let maxError = correctOrder.length - 1; // Maximum possible error is n-1 positions
        
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
        
        // Display or store the score
        if (document.getElementById('score-display')) {
            document.getElementById('score-display').textContent = `Score: ${score}`;
        } else {
            const scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'score-display';
            scoreDisplay.textContent = `Score: ${score}`;
            scoreDisplay.style.position = 'fixed';
            scoreDisplay.style.top = '10px';
            scoreDisplay.style.right = '10px';
            scoreDisplay.style.padding = '10px';
            scoreDisplay.style.background = '#fff';
            scoreDisplay.style.border = '1px solid #ccc';
            scoreDisplay.style.zIndex = '1000';
            document.body.appendChild(scoreDisplay);
        }
        
        return score;
    }
    
    // Add CSS to ensure tiles stay in container and show locked tiles
    const style = document.createElement('style');
    style.textContent = `
        .color-container {
            position: relative;
            display: flex;
            flex-wrap: wrap;
            min-height: 50px;
            width: 100%;
        }
        .color-tile {
            display: inline-block;
            position: relative;
            touch-action: none;
            z-index: 1;
            box-sizing: border-box;
        }
        .locked-tile {
            border: 2px solid gold !important;
            position: relative !important;
            z-index: 5 !important;
        }
        .placeholder {
            margin: 2px;
            box-sizing: border-box;
        }
        #score-display {
            font-weight: bold;
            font-family: Arial, sans-serif;
            background-color: rgba(255, 255, 255, 0.9) !important;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Ensure iPad touch compatibility */
        html, body {
            -webkit-overflow-scrolling: touch;
        }
        
        /* Debugging visibility */
        .color-tile {
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // Calculate initial score after tiles are positioned
    setTimeout(calculateScore, 1000);
    
    // Diagnostic information
    console.log(`Color tiles found: ${colorTiles.length}`);
    console.log(`Container dimensions: ${colorContainer.offsetWidth}x${colorContainer.offsetHeight}`);
    
    // Set container height explicitly if needed
    if (colorContainer.offsetHeight < 50) {
        colorContainer.style.minHeight = '100px';
    }
});
