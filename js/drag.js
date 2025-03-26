document.addEventListener('DOMContentLoaded', function() {
    const colorContainer = document.querySelector('.color-container');
    const colorTiles = document.querySelectorAll('.color-tile');
    
    let draggedTile = null;
    let dragStartX, dragStartY;
    let initialX, initialY;
    let isTouchDevice = false;
    
    // Initialize each tile with drag events
    colorTiles.forEach(tile => {
        tile.setAttribute('draggable', true);
        
        // When drag starts
        tile.addEventListener('dragstart', function(e) {
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
        });
        
        // Touch events for mobile support
        tile.addEventListener('touchstart', function(e) {
            isTouchDevice = true;
            e.preventDefault();
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
        }, { passive: false });
        
        tile.addEventListener('touchmove', function(e) {
            if (!draggedTile) return;
            e.preventDefault();
            
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
            
            // Find the drop position
            const afterElement = getDragAfterElement(colorContainer, touch.clientY, touch.clientX);
            if (afterElement) {
                colorContainer.insertBefore(draggedTile, afterElement);
            } else {
                colorContainer.appendChild(draggedTile);
            }
        }, { passive: false });
        
        tile.addEventListener('touchend', function(e) {
            if (!draggedTile) return;
            e.preventDefault();
            
            // Reset styles
            this.classList.remove('dragging');
            this.style.opacity = '1';
            this.style.position = '';
            this.style.left = '';
            this.style.top = '';
            
            draggedTile = null;
        }, { passive: false });
    });
    
    // Handle the dragover event to determine drop position
    colorContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        const draggingTile = document.querySelector('.dragging');
        if (!draggingTile) return;
        
        const afterElement = getDragAfterElement(colorContainer, e.clientY, e.clientX);
        if (afterElement) {
            colorContainer.insertBefore(draggingTile, afterElement);
        } else {
            colorContainer.appendChild(draggingTile);
        }
    });
    
    // Determine where to place the dragged element
    function getDragAfterElement(container, y, x) {
        const draggableElements = [...container.querySelectorAll('.color-tile:not(.dragging)')];
        
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
    
    // Add CSS to ensure tiles stay in container
    const style = document.createElement('style');
    style.textContent = `
        .color-container {
            position: relative;
            overflow: hidden;
        }
        .color-tile {
            position: relative;
        }
    `;
    document.head.appendChild(style);
});
