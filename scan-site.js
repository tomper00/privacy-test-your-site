/*
Simply copy this code and paste it into you browser console and hit enter!
Know issues:
Conotent security policys on the site might stop the execution (this is a good thing).
*/
function extractHostname(url) {

    if(url[0] == undefined) {
        //console.log("url undefined!");
        //console.log(url[0]);
        //console.log(url[1]);
        return "noVal";
    } 
    if(url[1] == "LINK" && url[0].search("data") != -1) {
        //console.log("exit 2");
        //console.log(url[0]);
        return "noVal";
    }

    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url[0].indexOf("//") > -1) {
        hostname = url[0].split('/')[2];
    }
    else {
        hostname = url[0].split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function site(domain, country, script) {
  this.domain = domain;
  this.country = country;
}
function fullSite(domain, country, script) {
  this.domain = domain;
  this.country = country;
  this.script = script;
}

var urls = [];
var tags = document.getElementsByTagName("*");
const doNotCheck = ["SVG", "SVGAnimatedString", "SPAN", "A", "use"];
var siteHostName =  window.location.host;
for(i=0;i<tags.length;i++) {
    if(tags[i].nodeName == "IMG" && tags[i].src.search("data") == -1) {
        urls.push([tags[i].href,tags[i].nodeName]);
        //console.log(tags[i].href);
        //console.log(tags[i].nodeName);
        //console.log(tags[i].src.search("data"));
    }
    else if(tags[i].nodeName == "IMG" && tags[i].src.search("data") != -1) {
                //Do nothing
    }
    else if(doNotCheck.includes(tags[i].nodeName) ) {
        //Do nothing
    }
    else if(tags[i].href != undefined && tags[i].href != "" && tags[i].href.search(siteHostName) == -1) {
        urls.push([tags[i].href,tags[i].nodeName]);
        //console.log(tags[i].href);
        //console.log(tags[i].nodeName);
    }
    else if(tags[i].src != undefined && tags[i].src != ""  && tags[i].src.search(siteHostName) == -1) {
       urls.push(tags[i].src);
       urls.push([tags[i].src,tags[i].nodeName]);
       //console.log(tags[i].src);
       //console.log(tags[i].nodeName);

    }
}


var fullDomains = [];
var domains = [];
for (i=0;i<urls.length;i++) {
    var hstName = extractHostname(urls[i]);
    if(window.location.host.includes(hstName)) {
       //console.log("do nothing" );
    }
    else if(hstName == "noVal") {
       //console.log("do nothing" );
    }
    else {
        if(domains.includes(hstName)) {
            //do nothing
        }
        else {
           var response = await fetch('https://dns.google/resolve?name='+hstName);
           var json = await response.json();
           //console.log(json.Answer);
           if(json.Answer) {
           var ipaddr = json.Answer.slice(-1)[0].data;
           var response2 = await fetch('https://get.geojs.io/v1/ip/country/'+ipaddr);
           var json2 = await response2.text();

           domains.push(new site(hstName, json2));
           fullDomains.push(new fullSite(hstName, json2, urls[i][0]));
          }
        }
    }
}

console.log("A list of all domains");
console.table(domains);
console.log("A list of external urls");
console.table(fullDomains);


