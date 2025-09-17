/**
 * ProTracker for Google Analytics 4 (Creative & Slider Tracking)
 * Version: 16.0.0
 *
 * This version adds the 'ad_creative' dimension and enhances tracking
 * for individual creatives within a slider placement.
 */

(function() {
    'use strict';

    const measurementId = 'G-VVLDGSNSL7';

    // --- 1. Core Functions & Initialization ---
    const configTag = document.querySelector('meta[name="adopstats"]');
    
    const pageLevelData = {
        pub: (configTag && configTag.dataset.pub) || '',
        domain: (configTag && configTag.dataset.domain) || '',
        page_type: (configTag && configTag.dataset.pageType) || '',
        content: document.title || '',
    };
    
    const pageCategoriesString = (configTag && configTag.dataset.category) || '';
    const pageCategories = pageCategoriesString.split(',').map(cat => cat.trim()).filter(Boolean);

    function initializeGtag() {
        if (window.gtag) return;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        const gtagScript = document.createElement('script');
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(gtagScript);
        gtag('config', measurementId, { 'send_page_view': false });
    }

    function sendEvent(eventName, eventData) {
        if (!window.gtag) return;
        const dataToSend = { ...pageLevelData, ...eventData, 'send_to': measurementId };
        window.gtag('event', eventName, dataToSend);
    }
    
    // --- 2. Event Processing Logic ---

    function trackPageview() {
        sendEvent('page_view', { cat: pageCategoriesString });
    }

    function observeVisibility(elementToObserve, impressionData) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (pageCategories.length > 0) {
                        pageCategories.forEach(category => {
                            sendEvent('ad_showed', { ...impressionData, cat: category });
                        });
                    } else {
                        sendEvent('ad_showed', impressionData);
                    }
                    observerInstance.unobserve(elementToObserve);
                }
            });
        }, { 
            threshold: 0.4
        });
        observer.observe(elementToObserve);
    }

    function processAdSlot(slotElement) {
        // **UPDATED: Read ad_creative from the main slot**
        const slotData = {
            inv: slotElement.dataset.inventory || '',
            ad_campaign: slotElement.dataset.adCampaign || '',
            ad_creative: slotElement.dataset.adCreative || '', // New dimension
        };

        if (pageCategories.length > 0) {
            pageCategories.forEach(category => {
                sendEvent('ad_request', { ...slotData, cat: category });
            });
        } else {
            sendEvent('ad_request', slotData);
        }

        const creatives = slotElement.querySelectorAll('.ssp-creative');
        const positionStyle = window.getComputedStyle(slotElement).position;
        const isStickyOrFixed = positionStyle === 'sticky' || positionStyle === 'fixed';

        if (creatives.length > 0) {
            // **UPDATED: Logic for Slider Banners**
            creatives.forEach(creative => {
                const creativeData = {
                    inv: slotElement.dataset.inventory || '',
                    ad_campaign: creative.dataset.adCampaign || slotData.ad_campaign,
                    // **Read creative-specific data, fallback to container's data**
                    ad_creative: creative.dataset.adCreative || slotData.ad_creative || '',
                };
                observeVisibility(creative, creativeData);
            });
        } else if (isStickyOrFixed) {
            if (pageCategories.length > 0) {
                pageCategories.forEach(category => {
                    sendEvent('ad_showed', { ...slotData, cat: category });
                });
            } else {
                sendEvent('ad_showed', slotData);
            }
        } else {
            observeVisibility(slotElement, slotData);
        }
    }

    // --- 3. Execution ---
    initializeGtag();
    trackPageview();

    function findAndProcessSlots() {
        const slotsFound = document.querySelectorAll('.adopspot');
        slotsFound.forEach(slot => {
            if (!slot.hasAttribute('data-ssp-processed')) {
                slot.setAttribute('data-ssp-processed', 'true');
                processAdSlot(slot);
            }
        });
    }

    window.addEventListener('load', () => {
        let attempts = 0;
        const maxAttempts = 5;
        const interval = setInterval(() => {
            findAndProcessSlots();
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 1000);
    });

})();