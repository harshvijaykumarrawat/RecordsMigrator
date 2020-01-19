var dataMap = null, recordTypeIndex = [], iteration;
let is_up_tracing = false, is_down_tracing = false, is_creating_sketch = true;

function get_key_object_map(record_id, callback){
	if(dataMap == null){
		executeGET({mode:0}, (resp) => {
			if(resp != null){
				let objectInfo = JSON.parse(resp);
				dataMap = createKeyObjectMap(objectInfo);
				let object = identify_object(record_id,dataMap);
				callback(object);
			}
		});
	}else{
		let object = identify_object(record_id,dataMap);
		callback(object);
	}
}

function get_object(object, record_id, callback, parent_name){
	if(object == null){
		console.log('Wrong Data');
		callback(false);
		return;
	}else{
		if(sketch.objects[object] == undefined){
			executeGET({mode:2, object:object}, (resp) => {
				if(resp != null){
					console.log('Describe obj')
					let object_value = JSON.parse(resp);
					if(is_creating_sketch){
						get_object_field_map(object_value);
						if(!is_up_tracing && !is_down_tracing)
							get_record(object, record_id, callback);
						else if(is_up_tracing && !is_down_tracing)
							get_parent_record(object, record_id, parent_name, callback);
						else
							callback(true);	
					}else{
						get_object_field_status(object_value);
					}
				}
			});
		}else if(record_id != null){
			if(!is_up_tracing && !is_down_tracing)
				get_record(object, record_id, callback);
			else if(is_up_tracing && !is_down_tracing)
				get_parent_record(object, record_id, parent_name, callback);
			else
				callback(false);
		}else{
			callback(true);
		}
	}
}

function get_parent_record(object, record_id, parent_name, callback){
	if(record_id == null){
		console.log('Wrong Data');
		callback(false);
		return;
	}else{
		if(sketch.record_id_map.record_id == undefined){
			executeGET({mode:3, object:parent_name}, (resp) => {
				if(resp != null){
					let record = JSON.parse(resp);
					console.log(record)
					setup_record_in_order(object, record)
				}
				callback(true);
			});
		}else{
			callback(true);
		}
	}
}

function get_record(object, record_id, callback){
	if(record_id == null){
		console.log('Wrong Data');
		callback(false);
		return;
	}else{
		if(sketch.record_id_map.record_id == undefined){
			executeGET({mode:1, object:object, record:record_id}, (resp) => {
				if(resp != null){
					let record = JSON.parse(resp);
					setup_record_in_order(object, record);
				}
				callback(true);
			});
		}else{
			callback(true);
		}
	}
}

function get_child_records(object, child_name, callback){
	if(sketch.record.id == null){
		console.log('Wrong Data');
		callback(false);
		return;
	}else{
		try{
		executeGET({mode:3, object:child_name}, (resp) => {
			if(resp != null){
				let record = JSON.parse(resp);
				console.log(record)
				if(record.records.length > 0){
					get_object(object, null, (isSuccess) => {
						setup_records_in_order(object, record);
						callback(true);
					}, null);
				}else{
					callback(false);
				}
			}else{
				callback(false);
			}
		});
		}catch(ex){
			callback(false);
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
	let field_map = [];
	for(let i = 0; i < object_value.fields.length; i++){
		if(object_value.fields[i].name == 'RecordTypeId'){
			field_map.push({name : object_value.fields[i].name, parent_api_name : object_value.fields[i].relationshipName , isParent : false, is_createable : object_value.fields[i].createable});
		}else{
			field_map.push({name : object_value.fields[i].name, parent_api_name : object_value.fields[i].relationshipName , isParent : object_value.fields[i].referenceTo != undefined && object_value.fields[i].referenceTo.length > 0, is_createable : object_value.fields[i].createable});
		}
		
	}
	sketch.objects[object_value.name] = field_map;
	if(!sketch.records.hasOwnProperty(object_value.name)){
		sketch.records[object_value.name] = [];
	}
	sketch.childs[object_value.name] = [];
	for(let i in object_value.childRelationships){
		sketch.childs[object_value.name].push({name:object_value.childRelationships[i].childSObject, field : object_value.childRelationships[i].field, relationship : object_value.childRelationships[i].relationshipName});		
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
		console.log(sketch.objects[object][i].name)
		recordArray.push(record[sketch.objects[object][i].name]);
		if(sketch.objects[object][i].name == 'RecordTypeId'
			&& record[sketch.objects[object][i].name] != null){
			recordTypeIndex.push(record[sketch.objects[object][i].name]);
			console.log('Record type Ids:'+record[sketch.objects[object][i].name])
		}
	}
	sketch.record_id_map[record.Id] = recordArray;
	sketch.records[object].push(recordArray);
	if (record.Id.startsWith(record_id_elem.value)
		&& !is_up_tracing
		&& !is_down_tracing){
		sketch.record.object = object;
		sketch.record.id = record.Id;
		sketch.record.index = sketch.records[object].length-1;
		sketch.record.values = recordArray;
		sketch.record_id_map[record_id_elem.value] = recordArray;
	}
	if(is_up_tracing && !is_down_tracing){
		sketch.to_up.push({object:object,index : sketch.records[object].length-1});
	}
	if(!is_up_tracing && is_down_tracing){
		sketch.to_down.push({object:object,index : sketch.records[object].length-1});
	}
}

function setup_records_in_order(object, records){
	for(var i in records.records){
		setup_record_in_order(object, records.records[i])
	}
	let recordArray = [];
	for(let i = 0; i < sketch.objects[object].length; i++){
		recordArray.push(record[sketch.objects[object][i].name]);
	}
}

function executeGET(config, callback){
	var result;
	switch(config.mode){
		//Get List of sObjects
		case 0:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/",{'Authorization':'Bearer '+token}));
		break;
		//Get record
		case 1:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/"+config.object+'/'+config.record,{'Authorization':'Bearer '+token}));
		break;
		//Describe sobject
		case 2:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/"+config.object+"/describe",{'Authorization':'Bearer '+token}));
		break;
		//Get Parents of Child
		case 3:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/"+sketch.object+'/'+sketch.record.id+'/'+config.object,{'Authorization':'Bearer '+token}));
		break;
		//Get Record Type records
		case 4:
			callback(execute("GET", baseURL + "services/data/v37.0/sobjects/RecordType/"+config.recordTypeId,{'Authorization':'Bearer '+token}));
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

function getRecordTypeIndex(callback){
	if(iteration < recordTypeIndex.length){		
		executeGET({mode:4, recordTypeId:recordTypeIndex[iteration]}, (resp) => {
			if(resp != null){
				let record = JSON.parse(resp);
				sketch.records.RecordTypes[record.Id] = {name : record.Name, devName : record.DeveloperName}
				sketch.record_id_map[record.Id] = record
				iteration++
				getRecordTypeIndex(callback)
			}
			callback(true);
		});
	}else{
		callback();
	}
	
	
}

function create_sketch(){
	var export_sketch = JSON.parse(JSON.stringify(sketch));
	export_sketch.record_id_list = Object.keys(export_sketch.record_id_map);
	export_sketch.record_id_map = undefined;
	export_sketch.object = undefined;
	export_sketch.childs = undefined;	
	final_sketch.innerHTML = JSON.stringify(export_sketch)
}