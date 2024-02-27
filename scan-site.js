/*
Simply copy this code and paste it into you browser console and hit enter!

It will log all external requests to the console and also generate a csv files.
We will also generate a csv listing all cookies, localStorage and sessionsStorage items. 


Know issues:
Content security policys on the site might stop the execution (this is a good thing).
If that is the case you can install a browser plugin to temorarly disable CSP for a site, then run the script and then dont forget to anable CSPs again.
Just search plugin store for Disable CSP to find alternatives
*/
async function fetchCountryAndOrg(ip) {
    const response = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
    const data = await response.json();
    return { country: data.country, organization: data.organization_name || 'Unknown' };
}

function extractHostname(url) {
    // Improved extraction logic to handle various URL formats robustly
    let hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname
    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    } else {
        hostname = url.split('/')[0];
    }
    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];
    return hostname;
}


async function collectUrls() {
    const urls = [];
    // Define a mapping of element types to resource types
    const elementTypeToResourceType = {
        'SCRIPT': 'Script',
        'LINK': 'CSS',
        'IMG': 'Image',
        'VIDEO': 'Video',
        'AUDIO': 'Audio',
        'OBJECT': 'Object',
        'EMBED': 'Embed',
        'IFRAME': 'Iframe',
        'SOURCE': 'Media Source' // For video and audio sources
    };

    document.querySelectorAll('script[src], link[href][rel="stylesheet"], img[src], video[src], audio[src], source[src], object[data], embed[src], iframe[src], link[href][rel="icon"], link[href][rel="shortcut icon"], link[href][rel="preload"]').forEach((element) => {
        const url = element.getAttribute('src') || element.getAttribute('href') || element.getAttribute('data');
        if (url && !isInternalUrl(url)) {
            // Determine the type based on the element
            const type = elementTypeToResourceType[element.tagName] || 'Other';
            urls.push({ url, type });
        }
    });

    return urls;
}


function parseCssForUrls(cssText) {
    const urls = [];
    // Regular expression to match URLs in CSS
    const urlPattern = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
    const importPattern = /@import\s+['"]?(url\()?(['"]?)([^'"\)]+?)\2(\))?['"]?;/g;

    let match;
    // Extracting URLs from url() patterns
    while ((match = urlPattern.exec(cssText)) !== null) {
        if (match[2] && !match[2].startsWith('data:')) { // Exclude data URLs
            urls.push(match[2]);
        }
    }

    // Extracting URLs from @import patterns
    while ((match = importPattern.exec(cssText)) !== null) {
        // match[3] contains the URL in @import rules
        if (match[3] && !match[3].startsWith('data:')) { // Exclude data URLs
            urls.push(match[3]);
        }
    }

    return urls;
}

function isInternalUrl(url) {
    const siteUrl = window.location.origin;
    return url.startsWith(siteUrl) || url.startsWith('/');
}


async function generateCSV(data, filename) {
    const now = new Date();
    const dateStr = now.toISOString().replace(/:\d{2}\.\d{3}Z$/, '').replace(/T/, '-').replace(/:/g, '-');
    const filenameWithDate = `${filename.split('.')[0]}-${dateStr}.csv`;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += filename.includes("requests") ? "Domain,Country,Organization,Script,Type\n" : "Type,Key,Value\n";
    
    data.forEach(item => {
        // Apply anonymization only to storage values and ensure JSON values are handled appropriately
        let value = item.value;
        if (filename.includes("storage") && typeof value === 'string' && !value.startsWith('{')) {
            value = anonymizeString(value);
        } else if (typeof value === 'string' && value.startsWith('{')) {
            try {
                JSON.parse(value);
                value = 'JSON: {"value":"*****"}'; // Simplified placeholder for valid JSON strings
            } catch (e) {
                // If it's not valid JSON, anonymize non-JSON string values
                value = anonymizeString(value);
            }
        }

        const line = filename.includes("requests") ?
            `"${escapeCSV(item.domain)}","${escapeCSV(item.country)}","${escapeCSV(item.organization)}","${escapeCSV(item.script)}","${escapeCSV(item.type)}"` :
            `"${escapeCSV(item.type)}","${escapeCSV(item.key)}","${escapeCSV(value, true)}"`;

        csvContent += line + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filenameWithDate);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCSV(value) {
    if (typeof value === 'string' && (value.includes('"') || value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}


function anonymizeString(str) {
    // Ensure string is not null
    if (!str) return str;
    
    // Anonymize up to 6 middle characters
    const maxAnonymizeCount = 6;
    let partLength = Math.floor((str.length - maxAnonymizeCount) / 2);
    partLength = partLength > 0 ? partLength : 0; // Ensure partLength is not negative

    if (str.length > maxAnonymizeCount) {
        str = `${str.substring(0, partLength)}${'*'.repeat(Math.min(maxAnonymizeCount, str.length - 2 * partLength))}${str.substring(str.length - partLength)}`;
    }
    
    // Truncate and add "..." if longer than 25 characters
    if (str.length > 25) {
        str = `${str.substring(0, 22)}...`;
    }
    
    return str;
}


async function analyzeAndReport() {
    const urls = await collectUrls();
    const domainsInfo = [];

    for (const { url, type } of urls) {
        const hostname = extractHostname(url);
        if (hostname === "noVal") continue;
        const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}`);
        const dnsData = await dnsResponse.json();
        if (dnsData.Answer) {
            const ip = dnsData.Answer.slice(-1)[0].data;
            const { country, organization } = await fetchCountryAndOrg(ip);
            domainsInfo.push({ domain: hostname, country, organization, script: url, type }); // Use determined type
        }
    }

    await generateCSV(domainsInfo, `privacy-report-requests-${window.location.host}.csv`);

    // Collect and report storage
    const storageItems = collectStorage();
    await generateCSV(storageItems, `privacy-report-storage-${window.location.host}.csv`);
}


function collectStorage() {
    const storageItems = [];
    // Improved collection logic

    // Collect localStorage and sessionStorage items
    ["localStorage", "sessionStorage"].forEach(storageType => {
        for (let i = 0; i < window[storageType].length; i++) {
            const key = window[storageType].key(i);
            const value = window[storageType].getItem(key);
            storageItems.push({ type: storageType, key, value }); // Removed party information
        }
    });

    // Collect cookies
    document.cookie.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const value = parts.join('=');
        storageItems.push({ type: 'COOKIE', key, value }); // Removed party information
    });

    return storageItems;
}

function anonymizeValue(value) {
    if (value.length <= 6) {
        return value; // Return the value as is if too short
    }
    const maskLength = Math.floor(value.length * 0.6); // Mask 60% of the value
    const startLength = Math.floor((value.length - maskLength) / 2);
    const endLength = value.length - maskLength - startLength;
    const maskedValue = value.substr(0, startLength) + '*'.repeat(maskLength) + value.substr(value.length - endLength);
    return maskedValue;
}

analyzeAndReport();



