/*
Simply paste this code into you browser console
Know issues:
Conotent security policys on the site might stop the execution (this is a good thing).
*/
function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
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


var scripts = document.querySelectorAll("script[src]");
//var scripts = document.querySelectorAll("link[href]");

var fullDomains = [];
var domains = [];
for (i=0;i<scripts.length;i++) {
	var hstName = extractHostname(scripts[i].src);
	if(window.location.host.includes(hstName)) {
	   //console.log("do nothing" );
	}

	else {
		if(domains.includes(hstName)) {
			//do nothing
		}
		else {
		   var response = await fetch('https://dns.google/resolve?name='+hstName);
           var json = await response.json();
           console.log(json.Answer);
           if(json.Answer) {
           var ipaddr = json.Answer.slice(-1)[0].data;	
           var response2 = await fetch('https://get.geojs.io/v1/ip/country/'+ipaddr);
           var json2 = await response2.text();

           domains.push(new site(hstName, json2));
          }
		}
	} 
}                                                
console.table(domains);

                               
