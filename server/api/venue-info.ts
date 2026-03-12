import { defineEventHandler, getQuery, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event);
  const url = queryParams.url;
  
  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' });
  }

  let venueName = '';
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const finalUrl = response.url;
    const urlObj = new URL(finalUrl);
    
    // Check if it's a direct Google Maps place URL
    // e.g., https://www.google.nl/maps/place/Caf%C3%A9+Bellevue/...
    const placeMatch = finalUrl.match(/\/maps\/place\/([^\/]+)/);
    if (placeMatch) {
      venueName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    if (!venueName) {
      venueName = urlObj.searchParams.get('q');
    }

    if (!venueName) {
      const html = await response.text();
      // Try to find the title
      const titleMatch = html.match(/<title>(.*?) - Google Search<\/title>/);
      if (titleMatch) {
        venueName = titleMatch[1];
      } else {
        // Look for the search link
        const searchMatch = html.match(/href="\/search\?q=([^"&]*)/);
        if (searchMatch) {
          venueName = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
        }
      }
    }

    if (!venueName) {
      return {
        venue: 'TBA',
        location: 'Netherlands',
        query: ''
      }
    }

    // A small cleanup for the venue name
    const cleanedVenue = venueName.replace(/\s+/g, ' ').trim();

    return {
      venue: cleanedVenue,
      location: '', // Location is usually part of the query anyway
      query: cleanedVenue
    };
  } catch (error) {
    console.error('Error resolving venue info:', error);
    return {
      venue: 'TBA',
      location: 'Netherlands',
      query: ''
    };
  }
});
