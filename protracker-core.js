/**
 * SSP ProTracker for Google Analytics 4
 * Version: 19.0.0 - Per-Creative Ad Request Logic
 *
 * This version sends an 'ad_request' for each individual creative found
 * within a carousel/slider, providing more granular request data.
 */
(function() {
    'use strict';

    const measurementId = 'G-VVLDGSNSL7';

    // --- 1. Core Functions & Initialization (No changes) ---
    const configTag = document.querySelector('meta[name="adopstats"]');
    const pageLevelData = {
        pub: (configTag && configTag.dataset.pub) || '',
        domain: (configTag && configTag.dataset.domain) || '',
        page_type: (configTag && configTag.dataset.pageType) || '',
        content: document.title || '',
        cat: (configTag && configTag.dataset.category) || '',
    };
    const pageCategories = pageLevelData.cat.split(',').map(c => c.trim()).filter(Boolean);
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
    function trackPageview() {
        sendEvent('page_view', {});
    }
    function observeVisibility(elementToObserve, impressionData) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    sendEvent('ad_showed', impressionData);
                    observerInstance.unobserve(elementToObserve);
                }
            });
        }, { threshold: 0.4 });
        observer.observe(elementToObserve);
    }

    // --- 2. Publisher Handlers ---
    // **UPDATED** Custom handler for The Standard
    function theStandardHandler() {
        const container = document.querySelector('.banner-slider');
        if (!container) return false;

        const campaignContainer = container.querySelector('.adsMasthead');
        if (!campaignContainer) return false;

        const creatives = [
            campaignContainer.querySelector('.hidden-xs'),
            campaignContainer.querySelector('.visible-xs')
        ].filter(Boolean);

        if (creatives.length === 0) return false;

        creatives.forEach(creative => {
            const creativeData = {
                inv: container.dataset.inventory || 'AdMasthead',
                ad_campaign: creative.dataset.adCampaign || campaignContainer.dataset.adCampaign || 'adsMasthead',
                ad_creative: creative.dataset.adCreative || (creative.classList.contains('hidden-xs') ? 'Desktop' : 'Mobile'),
            };

            if (pageCategories.length > 0) {
                pageCategories.forEach(cat => sendEvent('ad_request', { ...creativeData, cat: cat }));
            } else {
                sendEvent('ad_request', creativeData);
            }

            observeVisibility(creative, creativeData);
        });
        
        return true;
    }

    function defaultHandler() {
        function processAdSlot(slotElement) {
            const creatives = slotElement.querySelectorAll('.ssp-creative');

            if (creatives.length > 0) {
                creatives.forEach(creative => {
                    const creativeData = {
                        inv: slotElement.dataset.inventory || '',
                        ad_campaign: creative.dataset.adCampaign || slotElement.dataset.adCampaign || '',
                        ad_creative: creative.dataset.adCreative || '',
                    };

                    if (pageCategories.length > 0) {
                        pageCategories.forEach(cat => sendEvent('ad_request', { ...creativeData, cat: cat }));
                    } else {
                        sendEvent('ad_request', creativeData);
                    }

                    observeVisibility(creative, creativeData);
                });
            } else {
                const slotData = {
                    inv: slotElement.dataset.inventory || '',
                    ad_campaign: slotElement.dataset.adCampaign || '',
                    ad_creative: slotElement.dataset.adCreative || '',
                };

                if (pageCategories.length > 0) {
                    pageCategories.forEach(cat => sendEvent('ad_request', { ...slotData, cat: cat }));
                } else {
                    sendEvent('ad_request', slotData);
                }

                const positionStyle = window.getComputedStyle(slotElement).position;
                const isStickyOrFixed = positionStyle === 'sticky' || positionStyle === 'fixed';
                if (isStickyOrFixed) {
                    if (pageCategories.length > 0) {
                        pageCategories.forEach(cat => sendEvent('ad_showed', { ...slotData, cat: cat }));
                    } else {
                        sendEvent('ad_showed', slotData);
                    }
                } else {
                    observeVisibility(slotElement, slotData);
                }
            }
        }
        document.querySelectorAll('.adopspot').forEach(processAdSlot);
    }

    // --- 3. Execution ---
    initializeGtag();
    trackPageview();
    window.addEventListener('load', () => {
        const currentDomain = window.location.hostname.replace('www.', '');
        if (currentDomain === 'thestandard.co' && theStandardHandler()) {
            return;
        }
        defaultHandler();
    });
})();
