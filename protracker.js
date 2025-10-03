/**
 * ProTracker Loader
 * This script reliably loads the versioned core tracker file.
 */
(function() {
    // To update in the future, just change the version number here
    var coreTrackerVersion = 'v18.1.0'; 

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/gh/adopth/ADOP-Pro-tracking@' + coreTrackerVersion + '/protracker-core.js';
    document.head.appendChild(script);
})();
