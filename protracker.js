/**
 * SSP ProTracker for Google Analytics 4 (with Custom Publisher Logic)
 * Version: 18.0.0
 *
 * This version includes a custom handler for 'thestandard.co' to accommodate
 * their unique HTML structure, while maintaining default behavior for all other sites.
 */

(function () {
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
        window.gtag = function () { dataLayer.push(arguments); };
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
        sendEvent('page_view', { cat: pageCategoriesString });
    }

    // ฟังก์ชันพิเศษสำหรับ The Standard
    function theStandardHandler() {
        // const container = document.querySelector('.-banner-AdMasthead');
        const container = document.querySelector('.banner-slider');
        if (!container) return;

        const campaignContainer = container.querySelector('.adsMasthead');
        if (!campaignContainer) return;

        const desktopCreative = campaignContainer.querySelector('.hidden-xs');
        const mobileCreative = campaignContainer.querySelector('.visible-xs');

        const baseData = {
            inv: container.dataset.inventory || 'AdMasthead',
            ad_campaign: campaignContainer.dataset.adCampaign || 'adsMasthead',
        };

        if (pageCategories.length > 0) {
            pageCategories.forEach(cat => sendEvent('ad_request', { ...baseData, cat: cat }));
        } else {
            sendEvent('ad_request', baseData);
        }

        if (desktopCreative) {
            const desktopImpressionData = { ...baseData, ad_creative: desktopCreative.dataset.adCreative || 'Desktop' };
            observeVisibility(desktopCreative, desktopImpressionData);
        }

        if (mobileCreative) {
            const mobileImpressionData = { ...baseData, ad_creative: mobileCreative.dataset.adCreative || 'Mobile' };
            observeVisibility(mobileCreative, mobileImpressionData);
        }
    }

    const customPublisherHandlers = {
        'thestandard.co': theStandardHandler,
        // 'www.another-site.com': anotherSiteHandler,
    };



    // --- 3. Default Logic ---
    function defaultHandler() {
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
                creatives.forEach(creative => {
                    const creativeData = {
                        inv: slotElement.dataset.inventory || '',
                        ad_campaign: creative.dataset.adCampaign || slotData.ad_campaign,
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

        function findAndProcessSlots() {
            const slotsFound = document.querySelectorAll('.adopspot');
            slotsFound.forEach(slot => {
                if (!slot.hasAttribute('data-ssp-processed')) {
                    slot.setAttribute('data-ssp-processed', 'true');
                    processAdSlot(slotElement);
                }
            });
        }

        let attempts = 0;
        const maxAttempts = 5;
        const interval = setInterval(() => {
            findAndProcessSlots();
            attempts++;
            if (attempts >= maxAttempts) clearInterval(interval);
        }, 1000);
    }

    // --- 4. Execution ---
    initializeGtag();
    trackPageview();

    window.addEventListener('load', () => {
        const currentDomain = window.location.hostname.replace('www.', ''); // ทำให้ thestandard.co กับ www.thestandard.co เหมือนกัน

        if (customPublisherHandlers[currentDomain]) {
            customPublisherHandlers[currentDomain]();
        } else {
            defaultHandler();
        }
    });

})();
