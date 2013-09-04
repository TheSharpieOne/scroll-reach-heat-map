	var images = ['','-1','-7','-14','-30','-60','-90','-max'];
	var values = [0,1,7,14,30,60,90,120];
	var ga = {};
	var tab_clicks = {};
	var all_data = [];
	var tab_data = {};
	var tab_domain = [];
	var loading = false;
	var googleAuth;
	var storage = chrome.storage.local;
	var settings;
	
	function updateSettings(changes, areaName){
		settings = localStorage.accounts? JSON.parse(localStorage.accounts) : [];
		$.each(settings,function(i,setting){
			ga[setting.domain] = {
				"homepage":setting.homePage,
				"ga": setting.ga
			};
		});
	}
	
	updateSettings();

	if (typeof String.prototype.endsWith !== 'function') {
		String.prototype.endsWith = function(suffix) {
			return this.indexOf(suffix, this.length - suffix.length) !== -1;
		};
	}

	// Called when the url of a tab changes.
	function checkForValidUrl(tabId, changeInfo, tab) {
	  if (ga[tab.url.split("//")[1].split("/")[0]]) {
		tab_clicks[tabId] = 0;
		tab_data[tabId] = false;
		tab_domain[tabId] = tab.url.split("//")[1].split("/")[0];
		chrome.pageAction.show(tabId);
	  }else{
		chrome.pageAction.hide(tabId);
	  }
	};

	function clickListener(tab){
		if (loading)
			return;
		var clicks = tab_clicks[tab.id] || 0;
		clicks++;
		if(clicks >= images.length)
			clicks = 0;
		tab_clicks[tab.id] = clicks;
		if(clicks == 1)
			updateData(tab);
		else
			updateDisplay(tab);
	};
	
	function updateData(tab){
		loading = true;
		chrome.pageAction.setTitle({title : "Load Analytics data from Google...", tabId: tab.id});
		chrome.pageAction.setIcon({path: "images/loading.png", tabId: tab.id});
		var xhr;
		storage.get(tab_domain[tab.id],function(result){
			var lastUpdated = (result[tab_domain[tab.id]] && result[tab_domain[tab.id]].date) || 0;
			if((new Date() - new Date(lastUpdated)) < (24*60*60*1000)){
					all_data = JSON.parse(result[tab_domain[tab.id]].data);
					updateDisplay(tab);
			}else{
				AuthGoogle();
			}
		});
		
		
		function saveData(tab){
			var obj = {};
			obj[tab_domain[tab.id]] = {'data':(JSON.stringify(all_data)), 'date':(new Date()).toString()};
			storage.set(obj,function(){
				console.info("Scroll Reach: GA Stats Updated");
				updateDisplay(tab);
			});
		}
		
		function onStateChange(event) {
			if (xhr.readyState == 4) {
				if(xhr.status == 200) {
					// Great success: parse response with JSON
					var data = JSON.parse(xhr.responseText);
					all_data = all_data.concat(data.rows);
					chrome.pageAction.setTitle({title : "Loaded: "+Math.min((data.query["start-index"]+data.query["max-results"])-1,data.totalResults)+" of "+data.totalResults, tabId: tab.id});
					if(data.nextLink)
						getData(data.nextLink);
					else{
						saveData(tab);
					}
				}else{
					chrome.pageAction.setIcon({path: "images/error.png", tabId: tab.id});
					tab_clicks[tab.id] = 0;
					loading = false;
					if (xhr.status == 403){
						// if user doesn't have access to the GA account
						chrome.pageAction.setTitle({title : "Current Google account does not have access to the GA account you are using.", tabId: tab.id});
						console.warn("Current Google account does not have access to the GA account you are using.")
					}else {
						chrome.pageAction.setTitle({title : "Error when trying to access GA account information: "+xhr.statusText, tabId: tab.id});
						console.error("Error when trying to access GA account information: "+xhr.statusText);
					}
				}
			}
		};
		
		function getData(url){
			xhr = new XMLHttpRequest();
			xhr.onreadystatechange = onStateChange;
			xhr.open('GET', url, true);
			xhr.setRequestHeader('X-JavaScript-User-Agent', 'Scroll Reach API');
			xhr.setRequestHeader('Authorization', 'Bearer ' + googleAuth.getAccessToken());
			xhr.send();
		}
		
		function AuthGoogle(){
			googleAuth = new OAuth2('google', {
				client_id: '1072219598977-8ripngdbuv082e9bmqo36mle28hvt0v3.apps.googleusercontent.com',
				client_secret: 'YURtqxjjYwlXEhfoGatONQab',
				api_scope: 'https://www.googleapis.com/auth/analytics.readonly'
			});

			googleAuth.authorize(function() {
				function addZ(n){return n<10? '0'+n:''+n;}
				var d = new Date();
				var s = new Date();
				s.setDate(d.getDate()-120);
				getData('https://www.googleapis.com/analytics/v3/data/ga?ids=ga%3A'+ga[tab_domain[tab.id]].ga+'&start-date='+s.getFullYear()+ "-" + addZ(s.getMonth() + 1) + "-" + addZ(s.getDate()) +'&end-date='+d.getFullYear()+ "-" + addZ(d.getMonth() + 1) + "-" + addZ(d.getDate()) +'&metrics=ga%3Atotalevents&dimensions=ga%3Adate%2Cga%3Aeventlabel%2Cga%3Apagepath&max-results=10000&sort=-ga%3Adate&key=AIzaSyCE7nfhZQVcuaqZN--FsbaZODN8LGOFs-4');
			});
		}
	};
	
	function getTabData(tab){
		tab_data[tab.id] = [];
		var currentPage = tab.url.split(tab_domain[tab.id])[1];
		if(ga[tab_domain[tab.id]].homepage && currentPage == "/")
			currentPage = ga[tab_domain[tab.id]].homepage
		var tabdata = all_data.filter(function(l){return (l[2].split('?')[0].toLowerCase().endsWith(currentPage.toLowerCase()) && l[1].indexOf('%')>-1);});
		$.each(tabdata,function(i,l){
			tab_data[tab.id].push([(new Date(l[0].substring(0,4)+"-"+l[0].substring(4,6)+"-"+l[0].substring(6))),l[1],l[2].split('?')[0],l[3]]);
		});
	}
	
	function updateDisplay(tab){
		var tabId = tab.id;
		if(!tab_data[tabId])
			getTabData(tab);
		loading = false;
		var clicks = tab_clicks[tabId];
		if(clicks == 1){
			chrome.pageAction.setTitle({title : "Showing data for yesterday day", tabId: tab.id});
		}else{
			chrome.pageAction.setTitle({title : "Showing data for last "+values[clicks]+" days", tabId: tab.id});
		}
		chrome.pageAction.setIcon({path: "images/icon-38" + images[clicks] + ".png", tabId: tab.id});
		var dataSubset = tab_data[tabId];
		var dataCombined = [0,0,0,0,0,0,0,0,0,0];
		if(clicks == 0){
			chrome.tabs.sendMessage(tabId,{method:"remove"});
			chrome.pageAction.setTitle({title : "Click to view scroll reach heat map", tabId: tab.id});
			return;
		}
		if(clicks < 7){
			var today = new Date();
			dataSubset = tab_data[tabId].filter(function(l){
				return (today - l[0]) < ((values[clicks]+1)*24*60*60*1000);
			});
		}
		$.each(dataSubset,function(i,l){
			dataCombined[Math.min((parseInt(l[1])/10-1),9)] += parseInt(l[3]);
		});
		var totalViews = dataCombined[0];
		var gradient = "linear-gradient(to bottom";
		var colorBase = 255;
		$.each(dataCombined,function(i,p){
			var r = colorBase;
			var g = 0;
			var b = 0;
			if((p/totalViews)>=0.5){
				g = Math.round(colorBase * Math.abs((p/totalViews)-1)*2);
			}else{
				r = Math.round(colorBase * ((p/totalViews)*2));
				g = r;
				b = Math.round(colorBase * ((((totalViews-p)/totalViews)*2)-1));
			}
			gradient += ", rgba("+r+","+g+","+b+",0.5) "+(i+1)*10+"%";
		});
		gradient += ")";
		chrome.tabs.sendMessage(tabId,{method:"update",gradient:gradient,high:dataCombined[0],mid:dataCombined[4],low:dataCombined[9]});
	}

	// Listen for any changes to the URL of any tab.
	chrome.tabs.onUpdated.addListener(checkForValidUrl);

	// Listen for page action to be clicked.
	chrome.pageAction.onClicked.addListener(clickListener);
	
	// Listen for storage change, may be options page updating.
	chrome.storage.onChanged.addListener(updateSettings);
	
	chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
		delete tab_data[tabId];
	});