let init_mode_1 = document.getElementById('init_mode_1');
let record_id_elem = document.getElementById('recordId');
var baseURL, token;


var sketch = {objects:{}, records:{}, record : {}, to_up:[], to_down:[]}
//Initiating mode 1
//1. read record id
//2. read cookies
//3. GET Objects Info
init_mode_1.onclick = function(element) {
	
	let record_id = record_id_elem.value;
	if(record_id == undefined){
		console.log('Please enter record Id');
		return;
	}else if(record_id.length != 15 && record_id.length != 18) {
		console.log('Please enter proper record Id');
		return;
	}else{
		initModeOne(record_id);
	}
	
};

function getBaseUrl(url){
	var url_array = url.split('/');
	return `${url_array[0]}//${url_array[2]}/`;
}

function initModeOne(){
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {	
		baseURL = getBaseUrl(tabs[0].url);
		chrome.cookies.get({url:tabs[0].url, name:"sid"},(cookie)=>{
			token = cookie.value;
			get_key_object_map((object)=>{
				console.log(object+'---------------')
				get_object(object, record_id_elem.value)
			});
		});
	});
}