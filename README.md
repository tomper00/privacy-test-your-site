# privacy test your site
Run [this script](https://github.com/tomper00/privacy-test-your-site/blob/main/scan-site.js) to find out what external scripts you request and in what country the server that hosts them lives.

Note: for now it seems like it only works in Google Chrome.

## Notice about this script

The script will actually request other external sites (in the US) so please note that running it, will actually share  data about your browser with these 2 sites:

1. https://dns.google
2. https://get.geojs.io

Note: This script will only look into scripts. Please beware that other resources such as Javascripts, fonts etc might be loaded as well.

Also read our [blogpost](https://www.digitalist.se/blogg/svenska-myndigheter-maste-sluta-att-lacka-data-om-svenska-medborgares-surfvanor) (in Swedish) about why the public sector has to stop leaking data about their users.

## How to use it

Simply paste the code in the browser console to see from which sites you might load scripts.

![example](./example.png)

This script will generate 3 files:
privacy-report-requests-<hostname>-<date>.csv
privacy-report-storage-<hostname>-<date>.csv
privacy-report-externals-<hostname>-<date>.csv

### privacy-report-requests
Will list all external requests from the page you run the script on by simple looking into all elements like:
document.querySelectorAll('script[src], link[href][rel="stylesheet"], img[src], video[src], audio[src], source[src], object[data], embed[src], iframe[src], link[href][rel="icon"], link[href][rel="shortcut icon"], link[href][rel="preload"]')

For every external request we look up the hostname to fetch location and organisation of the server you request.
Path (url	where script was executed)
Domain (of the request)
Country (where the requested server is located)
Organization (That owns the server)
Script (The request)
Type (script/css etc)

**Important** to understand that even id the country is within the EU it is a problem if the Organisation is for example from USA, because of the FISA 702 law that requires companies to hand out data to USA goverment agencyies upon request no matter where the data center is located. (In practice this means you will never support GDPR).

### privacy-report-storage
We list cookies and values stored in localStorage or sessionStorage.
Note: This report is never complete, since we can not always read all cookies (security reasons). 

Path (url	where script was executed)
Type (Cookie, localStroage, sessionStorage)
Key (the name)
Value (Truncated and semi masked value for privacy reasons, so that you can share the report)

## privacy-report-externals
This report searches  Javascripts and CSS for external references. 
This report should be used to investigate the resources since a reference in this list does not automatically mean the resource was or will be done.
Use it to go though the files and investigate if it might be an issue. 

Path (url	where script was executed)
Script (The scanned script)
Exturl (The external reference)
Domain (of the request)
Country (where the requested server is located)
Organization (That owns the server)
Type (script/css)


## How to open the console in different browsers.

### Chrome

To open the developer console in Google Chrome, open the Chrome Menu in the upper-right-hand corner of the browser window and select More Tools > Developer Tools. You can also use the shortcut Option + ⌘ + J (on macOS), or Shift + CTRL + J (on Windows/Linux).

### Firefox

You open the Web Console from a menu or with a keyboard shortcut: Choose Web Console from the Web Developer submenu in the Firefox Menu (or Tools menu if you display the menu bar or are on Mac OS X) Press the Ctrl + Shift + K ( Command + Option + K on OS X) keyboard shortcut

### Internet Explorer

To open the developer console in Internet Explorer, click on the Gear Menu in the upper-right-hand corner of the browser window and select F12 Developer Tools. You can also press F12 to open it. The console will either open up within your existing Internet Explorer window, or in a new window.

### Edge

To open the developer console in Microsoft Edge, open the Edge Menu in the upper-right-hand corner of the browser window and select F12 Developer Tools. You can also press F12 to open it. The console will either open up within your existing Edge window, or in a new window. You may have to select the Console tab.

