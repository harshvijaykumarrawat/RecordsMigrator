let init_mode_1 = document.getElementById('init_mode_1');
let record_id_elem = document.getElementById('recordId');
let parents = document.getElementById('parents');
let chiled = document.getElementById('chiled');
let selected_parent = document.getElementById('selected_parent');
let selected_chiled = document.getElementById('selected_chiled');
let mode1_step1_submit = document.getElementById('mode1_step1_submit');
let mode1_step2_submit = document.getElementById('mode1_step2_submit');
var baseURL, token;
var text_value_map = {};
var sketch = {objects:{}, records:{}, record : {}, object : {}, to_up:[], to_down:[], record_id_map:{}};
//Initiating mode 1
//1. read record id
//2. read cookies
//3. GET Objects Info
init_mode_1.onclick = function(element) {
	
	let record_id = record_id_elem.value;
	if(record_id == undefined){
		//console.log('Please enter record Id');
		return;
	}else if(record_id.length != 15 && record_id.length != 18) {
		//console.log('Please enter proper record Id');
		return;
	}else{
		initModeOne(record_id);
	}
	
};

parents.onclick = function(element) {
	var selections = Array.from(parents.selectedOptions).map(o => o.value)
	var selections_text = Array.from(parents.selectedOptions).map(o => o.text)
	var selectedOptions = Array.from(parents.selectedOptions);
	text_value_map = {};
	console.log(selections);
	for(let i in selections){
		text_value_map[selections_text[i]] = selections[i];
	}
	selected_parent.innerHTML = Object.keys(text_value_map).join(';');
	
};

mode1_step1_submit.onclick = function(element) {
	for(var i in sketch.objects[sketch.object]){
		if(text_value_map[sketch.objects[sketch.object][i].name] != undefined){
			is_up_tracing = true;
			is_down_tracing = false;
			get_key_object_map(sketch.record.values[i],(object)=>{
				get_object(object, sketch.record.values[i], (isSuccess) => {
					if(isSuccess){
						console.log(sketch)
					}
				},
				text_value_map[sketch.objects[sketch.object][i].name]
				)
			}
			);		
		}
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
			is_up_tracing = false;
			is_down_tracing = false;
			get_key_object_map(record_id_elem.value,(object)=>{
				//console.log(object+'---------------')
				sketch.object = object;
				get_object(object, record_id_elem.value, (isSuccess) => {
					if(isSuccess){
						let innerHTML = "";
						//console.log(sketch.object);
						if(sketch.objects[sketch.object] != undefined){
							for(var i in sketch.objects[sketch.object]){
								if(sketch.objects[sketch.object][i].isParent){
									innerHTML += '<option value='+sketch.objects[sketch.object][i].parent_api_name+'>'+sketch.objects[sketch.object][i].name+'</option>'
								}else{
									//console.log(sketch.objects[sketch.object][i].name+' not a parent');
								}
							}
						}
						parents.innerHTML = innerHTML
					}
				}, null)
			});
		});
	});
}