/**
 * SSP ProTracker Core
 * Version: 18.2.0 (Corrected Handler Logic)
 * This version runs the custom 'thestandard.co' handler and the default handler
 * concurrently on that specific domain, while only running the default for others.
 */
(function() {
    'use strict';

    const measurementId = 'G-VVLDGSNSL7';

    // --- Core Functions & Initialization ---
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

    function trackPageview() {
        sendEvent('page_view', { cat: pageCategoriesString });
    }

    function observeVisibility(elementToObserve, impressionData) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (pageCategories.length > 0) {
                        pageCategories.forEach(category => sendEvent('ad_showed', { ...impressionData, cat: category }));
                    } else {
                        sendEvent('ad_showed', impressionData);
                    }
                    observerInstance.unobserve(elementToObserve);
                }
            });
        }, { threshold: 0.4 });
        observer.observe(elementToObserve);
    }

    // --- Publisher Handlers ---
    function theStandardHandler() {
        const container = document.querySelector('.banner-slider');
        if (!container) return false;
        const campaignContainer = container.querySelector('.adsMasthead');
        if (!campaignContainer) return false;
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
        return true;
    }

    function defaultHandler() {
        function processAdSlot(slotElement) {
            const slotData = {
                inv: slotElement.dataset.inventory || '',
                ad_campaign: slotElement.dataset.adCampaign || '',
                ad_creative: slotElement.dataset.adCreative || '',
            };
            if (pageCategories.length > 0) {
                pageCategories.forEach(category => sendEvent('ad_request', { ...slotData, cat: category }));
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
                        ad_creative: creative.dataset.adCreative || slotData.ad_creative,
                    };
                    observeVisibility(creative, creativeData);
                });
            } else if (isStickyOrFixed) {
                if (pageCategories.length > 0) {
                    pageCategories.forEach(category => sendEvent('ad_showed', { ...slotData, cat: category }));
                } else {
                    sendEvent('ad_showed', slotData);
                }
            } else {
                observeVisibility(slotElement, slotData);
            }
        }
        document.querySelectorAll('.adopspot').forEach(processAdSlot);
    }

    // --- Execution ---
    initializeGtag();
    trackPageview();

    window.addEventListener('load', () => {
        const currentDomain = window.location.hostname.replace('www.', '');
        if (currentDomain === 'thestandard.co') {
            theStandardHandler();
        }
        defaultHandler();
    });
})();
