document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const startButton = document.getElementById('startTest');
    const submitButton = document.getElementById('submitTest');
    const retakeButton = document.getElementById('retakeTest');
    const colorContainer = document.getElementById('colorContainer');
    const resultsContainer = document.getElementById('results');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    
    // Test state
    let testInProgress = false;
    let startTime;
    let timerInterval;
    let testColors = [];
    
    // Event listeners
    startButton.addEventListener('click', startTest);
    submitButton.addEventListener('click', submitTest);
    retakeButton.addEventListener('click', resetTest);
    
    // Initialize drag and drop functionality
    function initDragAndDrop() {
        const colorTiles = document.querySelectorAll('.color-tile');
        
        colorTiles.forEach(tile => {
            tile.setAttribute('draggable', true);
            
            tile.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tile.id);
                tile.classList.add('dragging');
                setTimeout(() => {
                    tile.style.display = 'none';
                }, 0);
            });
            
            tile.addEventListener('dragend', () => {
                tile.classList.remove('dragging');
                tile.style.display = 'block';
            });
        });
        
        colorContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(colorContainer, e.clientX);
            const dragging = document.querySelector('.dragging');
            if (dragging) {
                if (afterElement) {
                    colorContainer.insertBefore(dragging, afterElement);
                } else {
                    colorContainer.appendChild(dragging);
                }
            }
        });
        
        colorContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const draggableElement = document.getElementById(id);
            draggableElement.style.display = 'block';
            
            // Enable submit button when drag actions happen
            submitButton.disabled = false;
        });
    }
    
    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.color-tile:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Start the test
    function startTest() {
        testInProgress = true;
        startButton.disabled = true;
        submitButton.disabled = false;
        resultsContainer.classList.add('hidden');
        
        // Shuffle colors and create tiles
        testColors = shuffleColors(fm100Colors);
        createColorTiles();
        
        // Initialize drag and drop
        initDragAndDrop();
        
        // Start timer
        startTime = new Date();
        timerInterval = setInterval(updateTimer, 1000);
    }
    
    // Create color tiles in the container
    function createColorTiles() {
        colorContainer.innerHTML = '';
        
        testColors.forEach((color, index) => {
            const tile = document.createElement('div');
            tile.className = 'color-tile';
            tile.id = `color-${index}`;
            tile.dataset.color = color;
            tile.style.backgroundColor = color;
            colorContainer.appendChild(tile);
        });
    }
    
    // Update the timer display
    function updateTimer() {
        const now = new Date();
        const elapsedMs = now - startTime;
        const minutes = Math.floor(elapsedMs / 60000);
        const seconds = Math.floor((elapsedMs % 60000) / 1000);
        
        timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Submit test results
    function submitTest() {
        testInProgress = false;
        clearInterval(timerInterval);
        
        // Get the arrangement of colors
        const arrangement = Array.from(colorContainer.querySelectorAll('.color-tile'))
            .map(tile => tile.dataset.color);
        
        // Calculate score
        const errorScore = calculateScore(arrangement);
        
        // Display results
        scoreDisplay.textContent = `Your error score: ${errorScore} (Lower is better)`;
        resultsContainer.classList.remove('hidden');
        
        // Disable submit button, enable retake
        submitButton.disabled = true;
    }
    
    // Reset the test
    function resetTest() {
        colorContainer.innerHTML = '';
        startButton.disabled = false;
        submitButton.disabled = true;
        resultsContainer.classList.add('hidden');
        timerDisplay.textContent = 'Time: 00:00';
    }
});
