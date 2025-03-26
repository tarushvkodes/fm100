document.addEventListener('DOMContentLoaded', function() {
    const colorContainer = document.querySelector('.color-container');
    const colorTiles = document.querySelectorAll('.color-tile');
    
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
});
