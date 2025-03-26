// FM100 color data

const fm100Colors = [
    // These are approximations of the FM100 colors in hex format
    // Row 1 (Red to Yellow-Red)
    "#ff0000", "#ff1a00", "#ff2e00", "#ff4000", "#ff5000",
    "#ff5e00", "#ff6b00", "#ff7800", "#ff8300", "#ff8e00",
    "#ff9900", "#ffa300", "#ffad00", "#ffb600", "#ffc000",
    "#ffc900", "#ffd300", "#ffdc00", "#ffe500", "#ffee00",
    "#fff700", "#ffff00",
    
    // Row 2 (Yellow to Green-Yellow)
    "#f7ff00", "#eeff00", "#e5ff00", "#dcff00", "#d3ff00",
    "#c9ff00", "#c0ff00", "#b6ff00", "#adff00", "#a3ff00",
    "#99ff00", "#8eff00", "#83ff00", "#78ff00", "#6bff00",
    "#5eff00", "#50ff00", "#40ff00", "#2eff00", "#1aff00",
    "#00ff00",
    
    // Row 3 (Green to Blue-Green)
    "#00ff1a", "#00ff2e", "#00ff40", "#00ff50", "#00ff5e",
    "#00ff6b", "#00ff78", "#00ff83", "#00ff8e", "#00ff99",
    "#00ffa3", "#00ffad", "#00ffb6", "#00ffc0", "#00ffc9",
    "#00ffd3", "#00ffdc", "#00ffe5", "#00ffee", "#00fff7",
    "#00ffff",
    
    // Row 4 (Blue-Green to Blue-Purple)
    "#00f7ff", "#00eeff", "#00e5ff", "#00dcff", "#00d3ff",
    "#00c9ff", "#00c0ff", "#00b6ff", "#00adff", "#00a3ff",
    "#0099ff", "#008eff", "#0083ff", "#0078ff", "#006bff",
    "#005eff", "#0050ff", "#0040ff", "#002eff", "#001aff",
    "#0000ff",
    
    // Row 5 (Blue-Purple to Purple)
    "#1a00ff", "#2e00ff", "#4000ff", "#5000ff", "#5e00ff",
    "#6b00ff", "#7800ff", "#8300ff", "#8e00ff", "#9900ff",
    "#a300ff", "#ad00ff", "#b600ff", "#c000ff", "#c900ff",
    "#d300ff", "#dc00ff", "#e500ff", "#ee00ff", "#f700ff",
    
    // Row 6 (Purple to Red-Purple)
    "#ff00f7", "#ff00ee", "#ff00e5", "#ff00dc", "#ff00d3",
    "#ff00c9", "#ff00c0", "#ff00b6", "#ff00ad", "#ff00a3",
    "#ff0099", "#ff008e", "#ff0083", "#ff0078", "#ff006b"
];

// Get colors in correct order (for scoring)
const correctOrder = [...fm100Colors];

// Function to shuffle colors for the test
function shuffleColors(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Calculate error score based on the difference in positions
function calculateScore(arrangement) {
    let totalError = 0;
    
    for (let i = 0; i < arrangement.length; i++) {
        const color = arrangement[i];
        const correctIndex = correctOrder.indexOf(color);
        const differenceIndex = Math.abs(i - correctIndex);
        
        // Calculate circular difference (since colors form a circular pattern)
        const circularDifference = Math.min(differenceIndex, arrangement.length - differenceIndex);
        totalError += circularDifference;
    }
    
    return totalError;
}
