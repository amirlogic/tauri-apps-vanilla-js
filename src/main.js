// Global variables
let greetMsgEl;
let menu;

function updateRecentMenu() {
    // Implementation for updating the recent menu with recent files
    const recentMenuItems = history.slice(0, 10).map((item, index) => `{item}`);
    const recentMenu = {
        label: 'Recent',
        submenu: recentMenuItems
    };
    // You would need to integrate this recentMenu into your main menu logic
}

function loadMD(fname) {
    history.splice(0, 0, fname); // Use splice instead of push
    updateRecentMenu(); // Call updateRecentMenu after modifying history
    // Existing loadMD implementation...
}

// Error message function (assumed to exist in your code)
function errorMessage() {
    // Implementation...
}

// Recent menu section
const recent_menu = {
    items: [
        {label: 'r0'},
        {label: 'r1'},
        {label: 'r2'},
        {label: 'r3'},
        {label: 'r4'},
        {label: 'r5'},
        {label: 'r6'},
        {label: 'r7'},
        {label: 'r8'},
        {label: 'r9'}
    ]
};
// additional code...