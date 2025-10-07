/**
 * SSP Tracker
 * Version: 20.0.1
 *
 * This script is tailor-made for thestandard.co. It tracks pageviews, requests,
 * impressions, and clicks for both static (.adopspot) and slider (.adopspot-slider)
 * ad placements with specific counting logic for each.
 */

(function() {
    'use strict';

    const measurementId = 'G-VVLDGSNSL7';

    // --- 1. Core Functions & Initialization ---
    const configTag = document.querySelector('meta[name="adopstats"]');
    
    // 3.1 - 3.4: Gather all page-level data
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

    // 2.1) Count 1 normal pageview
    function trackPageview() {
        sendEvent('page_view', { cat: pageCategoriesString });
    }

    // Function to handle sending events for each category
    function sendCategorizedEvents(eventName, data) {
        if (pageCategories.length > 0) {
            pageCategories.forEach(category => {
                sendEvent(eventName, { ...data, cat: category });
            });
        } else {
            sendEvent(eventName, data);
        }
    }

    // --- 4.1) Static Banner Logic ---
    function processStaticSlot(slotElement) {
        const slotData = {
            inv: slotElement.dataset.inventory || '',
            ad_campaign: slotElement.dataset.adCampaign || '',
            ad_creative: slotElement.dataset.adCreative || '',
        };

        // 4.1.1) Ad Request: Count 1 event when found
        sendCategorizedEvents('ad_request', slotData);

        // 4.1.2) Ad Impression: Observe for 50% visibility
        const observer = new IntersectionObserver((entries, observerInstance) => {
            if (entries[0].isIntersecting) {
                sendCategorizedEvents('ad_impression', slotData);
                observerInstance.unobserve(slotElement);
            }
        }, { threshold: 0.5 });
        observer.observe(slotElement);

        // 4.1.3) Ad Click: Listen for a click event
        slotElement.addEventListener('click', () => {
            sendCategorizedEvents('ad_click', slotData);
        }, { once: true }); // 'once: true' ensures it only fires once
    }

    // --- 4.2) Slider Banner Logic ---
    function processSliderSlot(sliderContainer) {
        const inventory = sliderContainer.dataset.inventory || '';
        
        // 4.2.1) Ad Request: Count 1 event for the container
        sendCategorizedEvents('ad_request', { inv: inventory });

        const slides = sliderContainer.querySelectorAll('.banner-slide');
        slides.forEach(slide => {
            const slideData = {
                inv: inventory,
                ad_campaign: slide.dataset.adCampaign || '',
            };
            const creativeElement = slide.querySelector('.hidden-xs, .visible-xs');
            const creativeName = creativeElement ? (creativeElement.dataset.adCreative || '') : '';

            // 4.2.3) Ad Click: Listen for a click on the slide
            slide.addEventListener('click', () => {
                sendCategorizedEvents('ad_click', { ...slideData, ad_creative: creativeName });
            }, { once: true });

            // 4.2.2) Ad Impression: Watch for 'active' class AND visibility
            const mutationObserver = new MutationObserver(() => {
                if (slide.classList.contains('active')) {
                    if (creativeElement) {
                        const impressionData = { ...slideData, ad_creative: creativeName };
                        const intersectionObserver = new IntersectionObserver((entries, intObserver) => {
                            if (entries[0].isIntersecting) {
                                sendCategorizedEvents('ad_impression', impressionData);
                                intObserver.unobserve(creativeElement);
                            }
                        }, { threshold: 0.5 });
                        intersectionObserver.observe(creativeElement);
                    }
                }
            });
            mutationObserver.observe(slide, { attributes: true, attributeFilter: ['class'] });

            // Check if already active on load
            if (slide.classList.contains('active') && creativeElement) {
                const impressionData = { ...slideData, ad_creative: creativeName };
                const intersectionObserver = new IntersectionObserver((entries, intObserver) => {
                    if (entries[0].isIntersecting) {
                        sendCategorizedEvents('ad_impression', impressionData);
                        intObserver.unobserve(creativeElement);
                    }
                }, { threshold: 0.5 });
                intersectionObserver.observe(creativeElement);
            }
        });
    }

    // --- 3. Execution ---
    initializeGtag();
    trackPageview();

    window.addEventListener('load', () => {
        if (!window.location.hostname.includes('thestandard.co')) {
            return;
        }

        // 6.1) Find and process all Static Banners
        document.querySelectorAll('.adopspot').forEach(processStaticSlot);
        
        // 6.2) Find and process all Slider Banners
        document.querySelectorAll('.adopspot-slider').forEach(processSliderSlot);
    });

})();