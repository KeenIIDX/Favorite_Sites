// ==UserScript==
// @name           Favorite Sites
// @namespace      wilcoxone
// @description    Adds a list of sites you frequent.
// @include        http://citron/SiteSpecs/*
// @author         Elliott Wilcoxon
// @grant          none

// ==/UserScript==


function with_jquery(f) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery);";
    document.body.appendChild(script);
};

with_jquery(function($) {
	// Just adding some handy functions for later.
	NodeList.prototype.forEach = HTMLCollection.prototype.forEach = Array.prototype.forEach;

	var prefix = "favSites";
	function setStorage (key, value) {
		localStorage.setItem(prefix + key, JSON.stringify(value));
	}
	function getStorage (key) {
		return JSON.parse(localStorage.getItem(prefix + key));
	}
	function removeStorage (key) {
		localStorage.removeItem(prefix + key);
	}
	
	function SiteObject (siteID) {
		this.siteName = siteID;
		this.myLi = document.createElement("li");
		
		this.myLi.classList.add("site");
		this.myLi.innerHTML = "<a class='siteLink' href='javascript:void(0);'>" + siteID + "</a>";
	}
	
	function redrawSiteList () {
		// Empty it out.
		siteList.innerHTML = "";
		
		// Fill it up.
		favSites.forEach(function (siteObj) {
			siteList.appendChild(siteObj.myLi);
		});
		
		// In case there are no sites yet.
		if (favSites.length === 0) {
			siteList.innerHTML = '<span>Click "Edit" to add a site</span>';
		}
	}
	
	function addSite (siteID) {
		var newSite = new SiteObject(siteID);
		toggleEdit(newSite);
		
		// favSites is a sorted array.
		// Adding to an empty list.
		if (favSites.length === 0) {
			favSites.push(newSite);
			siteList.innerHTML = "";
			siteList.appendChild(newSite.myLi);
			
		} else {
			for (var i = 0; i <= favSites.length; i++) {
				// Adding to the end of the list.
				if ( i == favSites.length ) {
					favSites.push(newSite);
					siteList.appendChild(newSite.myLi);
					break;
				}
				// Adding to the middle somewhere.
				else {
					if ( newSite.siteName < favSites[i].siteName ) {
						favSites.splice(i, 0, newSite);
						siteList.insertBefore(newSite.myLi, favSites[i+1].myLi);
						break;
					}
				}
			}
		}

		syncFavSites();
	}
	
	function removeSite (LiObj) {
		var siteIndex = favSites.map(function(item) { return item.myLi;}).indexOf(LiObj);
		
		favSites.splice(siteIndex, 1);
		
		syncFavSites();
	}
	
	function syncFavSites () {
		// Has favSites been initialized?
		if (Array.isArray(favSites)) {
			// Write the list of sites in favSites out to localStorage.
			setStorage("favSites", favSites.map(function(siteObj) { return siteObj.siteName; } ) );
		} 
		else {
			favSites = [];
			var siteArray = getStorage("favSites") || [];
			
			siteArray.forEach(function (siteID) { favSites.push(new SiteObject(siteID)); } );
		}
	}
	
	function toggleEdit (siteObj) {
		// If we're in edit mode.
		if ( editLink.classList.contains('hidden') ) {
			siteObj.myLi.classList.add('editSite');
			siteObj.myLi.firstChild.removeAttribute('href');
		}
		else {
			siteObj.myLi.classList.remove('editSite');
			siteObj.myLi.firstChild.href = 'javascript:void(0);';
		}
	}
	
	// Define CSS.
	var myCss = document.createElement("style");
	myCss.type = "text/css";
	myCss.innerHTML =  '.site { list-style-type: disc;										\
								list-style-position: inside;								\
							  }																\
						.editSite { list-style-type: none;									\
								background-image: url(http://citron/CFIDE/scripts/ajax/resources/yui/tm.gif); \
								background-repeat: no-repeat;								\
								background-position: 0px -2px;								\
								margin-left: -5px;											\
								padding-left: 17px;											\
							  }																\
						.hidden { display: none; }											\
						';

	document.head.appendChild(myCss);
	
	// Event handler
	var myEvents = function (e) {
		//alert("whaaaa?");
		if (e.target === editLink) {
			// Entering edit mode.
		
			// Change visible buttons in footer.
			editLink.classList.add("hidden");
			addLink.classList.remove("hidden");
			exitLink.classList.remove("hidden");
			
			// Make site links not clickable, and add minus buttons.
			favSites.forEach(toggleEdit);
		}
		
		if (e.target === exitLink) {
			// Exiting edit mode.
		
			// Change visible buttons in footer.
			editLink.classList.remove("hidden");
			addLink.classList.add("hidden");
			exitLink.classList.add("hidden");
			
			// Update the list of sites, set them to not be edittable.
			redrawSiteList();
			favSites.forEach(toggleEdit);
		}
		
		if (e.target.classList.contains("editSite")) {
			// Mark the clicked item.
			e.target.style.fontStyle = "italic";
			
			// Remove clicked-on site.
			removeSite(e.target);
		}
		
		if (e.target.classList.contains("siteLink")) {
			// Clicking on a link to a site.
			
			if (e.target.hasAttribute('href')) {
				// Find the index for the clicked-on site.  Select it and submit.
				for (var i=0; i < document.sites.SID.options.length; i++) {
					if (e.target.innerHTML == document.sites.SID.options[i].text) {
						document.sites.SID.options[i].selected = true;
						document.sites.submit();
						break;
					}
				}
			}
		}
		
		if (e.target === addLink) {
			// Add the highlighted site from the site list.
			
			if (document.sites.SID.selectedIndex != -1) {
				var siteToAdd = document.sites.SID[document.sites.SID.selectedIndex].text;
				
				addSite(siteToAdd);
			}
		}
	};
	
	// Wrapper for site list.
	var mainTemplate = document.createElement("div");
	mainTemplate.innerHTML = "Favorite Sites:";
	mainTemplate.style.textAlign = "center";
	mainTemplate.style.paddingTop = "10px";
	mainTemplate.onclick = myEvents;

	// List itself.
	var siteList = document.createElement("ul");
	siteList.style.textAlign = "left";
	siteList.style.paddingLeft = "46px";
	mainTemplate.appendChild(siteList);
	
	// Initialize favSites from localStorage, then populate the site list.
	var favSites = "uninitialized";
	syncFavSites();
	redrawSiteList();
	
	// Build footer links/buttons.
	var editLink = document.createElement("a");
	editLink.innerHTML = "Edit";
	editLink.href = "javascript:void(0);";
	mainTemplate.appendChild(editLink);
	
	mainTemplate.appendChild(document.createTextNode(" "));
	
	var addLink = document.createElement("a");
	addLink.innerHTML = "Add";
	addLink.href = "javascript:void(0);";
	addLink.classList.add("hidden");
	mainTemplate.appendChild(addLink);
	
	mainTemplate.appendChild(document.createTextNode(" "));
	
	var exitLink = document.createElement("a");
	exitLink.innerHTML = "Exit";
	exitLink.href = "javascript:void(0);";
	exitLink.classList.add("hidden");
	mainTemplate.appendChild(exitLink);
	
	// Add the whole thing to the page.
	document.getElementById("sidebar1").appendChild(mainTemplate);
});


