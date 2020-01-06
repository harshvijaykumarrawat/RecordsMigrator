var sketch = {objects:{}, records:{}, record : {}, to_up:[], to_down:[], record_id_map:{}};
var dataMap = null;
let is_up_tracing = false, is_down_tracing = false;

function get_key_object_map(callback){
	if(dataMap == null){
		executeGET({mode:0}, (resp) => {
			if(resp != null){
				let objectInfo = JSON.parse(resp);
				dataMap = createKeyObjectMap(objectInfo)
				console.log('*************')
				console.log(dataMap)
				let object = identify_object(record_id_elem.value,dataMap);
				callback(object);
			}
		});
	}else{
		let object = identify_object(record_id_elem.value,dataMap);
		callback(object);
	}
}

function get_object(object, record_id){
	if(object == null){
		console.log('Wrong Data');
		return;
	}else{
		if(sketch.objects[object] == undefined){
			executeGET({mode:2, object:object}, (resp) => {
				if(resp != null){
					console.log('Describe obj')
					let object_value = JSON.parse(resp);
					get_object_field_map(object_value);
					get_record(object, record_id);
				}
			});
		}else if(record_id != null){
			get_record(object, record_id);
		}
	}
}

function get_record(object, record_id){
	if(record_id == null){
		console.log('Wrong Data');
		return;
	}else{
		if(sketch.record_id_map.record_id == undefined){
			executeGET({mode:1, object:object, record:record_id}, (resp) => {
				if(resp != null){
					let record = JSON.parse(resp);
					setup_record_in_order(object, record)
				}
				console.log(JSON.stringify(sketch));
			});
		}else{
			console.log(JSON.stringify(sketch));
		}
	}
}

function createKeyObjectMap(response_property){
	var data_map = {};
	for(let i = 0; i <  response_property.sobjects.length; i++){
		if(response_property.sobjects[i]['keyPrefix']  != undefined){
			data_map[response_property.sobjects[i].keyPrefix] = response_property.sobjects[i].name;
		}
	}
	return data_map;
}

function get_object_field_map(object_value){
	var field_map = [];
	for(let i = 0; i < object_value.fields.length; i++){
		field_map.push({name : object_value.fields[i].name, isParent : object_value.fields[i].referenceTo != undefined && object_value.fields[i].referenceTo.length > 0});
	}
	sketch.objects[object_value.name] = field_map;
	if(!sketch.records.hasOwnProperty(object_value.name)){
		sketch.records[object_value.name] = [];
	}
}

function identify_object(record_id,dataMap){
	if(dataMap[record_id.substring(0,3)] != undefined){
		return dataMap[record_id.substring(0,3)];
	}
	return;
}

function setup_record_in_order(object, record){
	var recordArray = [];
	for(let i = 0; i < sketch.objects[object].length; i++){
		recordArray.push(record[sketch.objects[object][i].name]);
	}
	sketch.record_id_map[record.Id] = recordArray;
	sketch.records[object].push(recordArray);
	if(record.Id.startsWith(record_id_elem.value)){
		sketch.record.object = object;
		sketch.record.index = sketch.records[object].length-1;
		sketch.record_id_map[record_id_elem.value] = recordArray;
	}
	if(is_up_tracing){
		sketch.is_up.push({object:object,index : sketch.records[object].length-1});
	}
	if(is_down_tracing){
		sketch.is_down.push({object:object,index : sketch.records[object].length-1});
	}
}

function executeGET(config, callback){
	var result;
	switch(config.mode){
		case 0:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/",{'Authorization':'Bearer '+token}));
		break;
		case 1:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/"+config.object+'/'+config.record,{'Authorization':'Bearer '+token}));
		break;
		case 2:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/"+config.object+"/describe",{'Authorization':'Bearer '+token}));
		break;
	}
}

function execute(method, url, headers){
	try{
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, false);
		for(let key in headers){
			xhr.setRequestHeader(key, headers[key]);
		}
		xhr.send();			
		return xhr.responseText;
	}catch(ex){
		console.log('Please help us to enhance the project. Open console and copy the error and send us on harawat@deloitte.com');
		result = null;
	}
}

function create_sketch(){
	var export_sketch = JSON.parse(JSON.stringify(sketch));
	export_sketch.record_id_map = undefined;
	navigator.clipboard.writeText(JSON.stringify(export_sketch))
	.then(() => {
		console.log('Text copied to clipboard');
	})
	.catch(err => {
		// This can happen if the user denies clipboard permissions:
		console.error('Could not copy text: ', err);
	});
}