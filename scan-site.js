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
    const elements = document.querySelectorAll('a, img, script, link');
    elements.forEach(elm => {
        // Improved to collect only external resources and avoid duplicates
        let url = elm.tagName === 'A' ? elm.href : (elm.src || elm.href);
        if (url && !urls.includes(url) && !url.includes(document.location.host)) {
            urls.push(url);
        }
    });
    return urls;
}


async function generateCSV(data, filename) {
    const now = new Date();
    const dateStr = now.toISOString().replace(/:\d{2}\.\d{3}Z$/, '').replace(/T/, '-').replace(/:/g, '-');
    const filenameParts = filename.split('.');
    const extension = filenameParts.pop();
    const filenameWithDate = `${filenameParts.join('.')}-${dateStr}.${extension}`;

    let csvContent = "data:text/csv;charset=utf-8,";
    if (filename.includes("requests")) {
        csvContent += "Domain,Country,Organization,Script,Type\n";
        data.forEach(item => {
            csvContent += `"${escapeCSV(item.domain)}","${escapeCSV(item.country)}","${escapeCSV(item.organization)}","${escapeCSV(item.script)}","${escapeCSV(item.type)}"\n`;
        });
    } else {
        csvContent += "Type,Key,Value\n";
        data.forEach(item => {
            // Use the third parameter to indicate this is a storage value needing anonymization
            let anonymizedValue = item.value;
            if(!item.value.includes("{")) 
              anonymizedValue = anonymizeString(item.value); // Anonymize the value
             
            csvContent += `"${escapeCSV(item.type)}","${escapeCSV(item.key)}","${escapeCSV(anonymizedValue, true)}"\n`;
        });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filenameWithDate);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCSV(value, isJsonValue = false, isStorageValue = false) {
    if (isJsonValue) {
        try {
            const parsedValue = JSON.parse(value);
            if (typeof parsedValue === 'object') {
                // If the value is valid JSON and an object or array, replace it with a placeholder
                return 'JSON: {"value":"*****"}';
            }
        } catch (e) {
            // If parsing fails, it's not valid JSON, proceed with normal processing
        }
    }

    // Apply anonymization only for storage values that are not JSON
    if (!isJsonValue && isStorageValue && typeof value === 'string') {
        value = anonymizeString(value);
    }

    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
        // If value contains double quotes, commas, or newlines, escape the double quotes and wrap in double quotes.
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}


function anonymizeString(str) {
    const maxLength = 25; // Maximum length before adding "..."
    const maxAnonymizeCount = 4; // Maximum number of characters to anonymize

    // Proceed with anonymization if the string is long enough
    if (str.length > maxAnonymizeCount + 4) { // Check if string is long enough to anonymize
        const startLength = (str.length - maxAnonymizeCount) / 2; // Calculate the length of the starting part to keep
        const endStartIndex = Math.ceil(startLength + maxAnonymizeCount); // Calculate where the ending part starts
        const endLength = str.length - endStartIndex; // Calculate the length of the ending part to keep
        str = str.substring(0, Math.floor(startLength)) + '*'.repeat(maxAnonymizeCount) + str.substring(str.length - endLength);
    }
    
    // Check if the string exceeds the maxLength after anonymization and truncate if necessary
    if (str.length > maxLength) {
        str = str.substring(0, maxLength - 3) + '...';
    }
    
    return str;
}


async function analyzeAndReport() {
    const urls = await collectUrls();
    const domainsInfo = [];

    for (const url of urls) {
        const hostname = extractHostname(url);
        if (hostname === "noVal") continue;
        const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}`);
        const dnsData = await dnsResponse.json();
        if (dnsData.Answer) {
            const ip = dnsData.Answer.slice(-1)[0].data;
            const { country, organization } = await fetchCountryAndOrg(ip);
            domainsInfo.push({ domain: hostname, country, organization, script: url, type: 'REQUEST' });
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



