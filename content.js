chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
		var request_actions = {
			remove:function(){
				$('#scrollReachHeatMap, #scrollReachHeatLegendWrap').remove();
			},
			update:function(){
				if($('#scrollReachHeatMap').length == 0){
					$("body").append($("<div />").attr({
						"id": "scrollReachHeatMap",
						"style": "position: absolute;top:0;left:0;width:100%;height:"+document.height+"px"
					}),$("<div />").attr({
						"id": "scrollReachHeatLegendWrap",
						"style": "position: fixed;bottom:75px;left:50px;width:350px;height:px;"
					}).append($("<div />").attr({
						"id": "scrollReachHeatLegendStats",
						"style": "color: white; font-size: 14px;text-shadow: 0px 0px 1px rgb(0, 0, 0);font-weight:bold;"
					}).append($("<div />").attr({
						"id": "scrollReachHeatLegendStatsHigh",
						"style": "float:left;width:33%;text-align:left;"
					}),$("<div />").attr({
						"id": "scrollReachHeatLegendStatsMid",
						"style": "float:left;width:34%;text-align:center;"
					}),$("<div />").attr({
						"id": "scrollReachHeatLegendStatsLow",
						"style": "float:right;width:33%;text-align:right;"
					})),$("<div />").attr({
						"id": "scrollReachHeatLegend",
						"style": "width: 100%;height: 15px;clear:both;"
					})));
				}
				$("#scrollReachHeatLegendStatsHigh").text(request.high);
				$("#scrollReachHeatLegendStatsMid").text(request.mid);
				$("#scrollReachHeatLegendStatsLow").text(request.low);
				$('#scrollReachHeatMap').css({"background":request.gradient});
				$('#scrollReachHeatLegend').css({"background":request.gradient.replace("bottom","right")});
			}
		};
		request_actions[request.method]();
    }
);
