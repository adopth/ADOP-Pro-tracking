/**
 * ProTracker Loader
 * This script reliably loads the versioned core tracker file.
 * To update, change the 'coreTrackerVersion' variable below.
 */
(function() {
    // To update in the future, just change this version number
    var coreTrackerVersion = 'v20.0.1'; 

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/gh/adopth/ADOP-Pro-tracking@' + coreTrackerVersion + '/protracker-core.js';
    document.head.appendChild(script);
})();