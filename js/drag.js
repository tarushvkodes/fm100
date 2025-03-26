document.addEventListener('DOMContentLoaded', function() {
    const colorContainer = document.querySelector('.color-container');
    const colorTiles = document.querySelectorAll('.color-tile');
    
    let draggedTile = null;
    let dragStartX, dragStartY;
    let initialX, initialY;
    let isTouchDevice = false;
    let correctOrder = [];
    
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
    
    // Lock first and last tiles to their correct positions
    function lockEndTiles() {
        const firstTile = correctOrder[0].element;
        const lastTile = correctOrder[correctOrder.length - 1].element;
        
        // Add a special class to visually indicate locked tiles
        firstTile.classList.add('locked-tile');
        lastTile.classList.add('locked-tile');
        
        // Make them non-draggable
        firstTile.setAttribute('draggable', false);
        lastTile.setAttribute('draggable', false);
        
        // Move them to start and end positions
        colorContainer.insertBefore(firstTile, colorContainer.firstChild);
        colorContainer.appendChild(lastTile);
    }
    
    lockEndTiles();
    
    // Initialize each tile with drag events
    colorTiles.forEach(tile => {
        // Skip locked tiles
        if (tile.classList.contains('locked-tile')) return;
        
        tile.setAttribute('draggable', true);
        
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
        
        // Touch events for mobile support - improved for iPad
        tile.addEventListener('touchstart', function(e) {
            if (this.classList.contains('locked-tile')) {
                e.preventDefault();
                return;
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
            
            // Prevent scrolling while dragging
            e.preventDefault();
        }, { passive: false });
        
        tile.addEventListener('touchmove', function(e) {
            if (!draggedTile || this.classList.contains('locked-tile')) return;
            
            const touch = e.touches[0];
            const offsetX = touch.clientX - dragStartX;
            const offsetY = touch.clientY - dragStartY;
            
            // Get container boundaries
            const containerRect = colorContainer.getBoundingClientRect();
            
            // Calculate new position
            let newX = initialX + offsetX;
            let newY = initialY + offsetY;
            
            // Apply bounds checking
            const tileRect = this.getBoundingClientRect();
            if (newX < containerRect.left) newX = containerRect.left;
            if (newY < containerRect.top) newY = containerRect.top;
            if (newX + tileRect.width > containerRect.right) newX = containerRect.right - tileRect.width;
            if (newY + tileRect.height > containerRect.bottom) newY = containerRect.bottom - tileRect.height;
            
            // Position the tile
            this.style.position = 'absolute';
            this.style.left = `${newX - containerRect.left}px`;
            this.style.top = `${newY - containerRect.top}px`;
            this.style.zIndex = '1000'; // Ensure dragged tile is on top
            
            // Find the drop position
            const afterElement = getDragAfterElement(colorContainer, touch.clientY, touch.clientX);
            
            // Don't allow insertion before first tile or after last tile
            if (afterElement) {
                if (afterElement !== correctOrder[correctOrder.length - 1].element) {
                    colorContainer.insertBefore(draggedTile, afterElement);
                }
            } else {
                // Don't append if it would make it come after the last tile
                const lastElement = correctOrder[correctOrder.length - 1].element;
                const lastElementIndex = Array.from(colorContainer.children).indexOf(lastElement);
                const draggedIndex = Array.from(colorContainer.children).indexOf(draggedTile);
                
                if (draggedIndex < lastElementIndex) {
                    colorContainer.insertBefore(draggedTile, lastElement);
                }
            }
            
            e.preventDefault(); // Prevent scrolling while dragging
        }, { passive: false });
        
        tile.addEventListener('touchend', function(e) {
            if (!draggedTile || this.classList.contains('locked-tile')) return;
            
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
            
            // Reset styles
            this.classList.remove('dragging');
            this.style.opacity = '1';
            this.style.position = '';
            this.style.left = '';
            this.style.top = '';
            this.style.zIndex = '';
            
            draggedTile = null;
            
            e.preventDefault();
        }, { passive: false });
    });
    
    // Handle the dragover event to determine drop position
    colorContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        const draggingTile = document.querySelector('.dragging');
        if (!draggingTile || draggingTile.classList.contains('locked-tile')) return;
        
        const afterElement = getDragAfterElement(colorContainer, e.clientY, e.clientX);
        
        // Don't allow insertion before first tile or after last tile
        if (afterElement) {
            if (afterElement !== correctOrder[correctOrder.length - 1].element) {
                colorContainer.insertBefore(draggingTile, afterElement);
            }
        } else {
            // Don't append if it would make it come after the last tile
            const lastElement = correctOrder[correctOrder.length - 1].element;
            const lastElementIndex = Array.from(colorContainer.children).indexOf(lastElement);
            const draggedIndex = Array.from(colorContainer.children).indexOf(draggingTile);
            
            if (draggedIndex < lastElementIndex) {
                colorContainer.insertBefore(draggingTile, lastElement);
            }
        }
    });
    
    // Determine where to place the dragged element
    function getDragAfterElement(container, y, x) {
        // Don't consider locked tiles when calculating position
        const draggableElements = [...container.querySelectorAll('.color-tile:not(.dragging):not(.locked-tile)')];
        
        // Add first tile to ensure we can't place before it
        const firstElement = correctOrder[0].element;
        if (!draggableElements.includes(firstElement)) {
            draggableElements.unshift(firstElement);
        }
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = {
                y: y - box.top - box.height / 2,
                x: x - box.left - box.width / 2
            };
            
            // Calculate distance using both X and Y coordinates
            const distance = Math.sqrt(offset.y * offset.y + offset.x * offset.x);
            
            if (distance < closest.distance) {
                return { element: child, distance: distance };
            } else {
                return closest;
            }
        }, { element: null, distance: Number.POSITIVE_INFINITY }).element;
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
            overflow: hidden;
            min-height: 50px;
        }
        .color-tile {
            position: relative;
            touch-action: none;
        }
        .locked-tile {
            border: 2px solid gold !important;
            position: relative !important;
        }
        #score-display {
            font-weight: bold;
            font-family: Arial, sans-serif;
        }
    `;
    document.head.appendChild(style);
    
    // Calculate initial score
    setTimeout(calculateScore, 500);
});
