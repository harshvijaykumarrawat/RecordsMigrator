var records_in_order = [];
var records = {};
var acceptable_Ids;
function read_sketch(sketch){
	acceptable_Ids = new Set(sketch.record_id_list);
	if(sketch.objects != null){
		for(let object_name in sketch.objects){
			for(let i in sketch.records[object_name])
				create_request_record(sketch, object_name,sketch.objects[object_name],sketch.records[object_name][i]);
		}
		create_record_order(sketch.records, sketch.record, sketch.to_up, sketch.to_down);
	}
}

function create_request_record(sketch, object_name, object, record){
	if(records[object_name] == null){
		records[object_name] = {};
	}
	let upload_record = {};
	let record_id;
	for(let i in object){
		if(object[i].is_createable
			&& object[i].name != 'OwnerId'
			&& record[i] != null
			&& (!object[i].isParent
				|| acceptable_Ids.has(record[i]))){
			if(object[i].name == 'RecordTypeId'){
				upload_record['RecordType'] = {
					Name : sketch.records.RecordTypes[record[i]].name
				}
			}else{
				upload_record[object[i].name] = record[i];
			}
		}
	}
	records[record[0]] = upload_record;
}

function create_record_order(records, record, up_order, down_order){
	for(let i in up_order){
		records_in_order.push({obj : up_order[i].object, id: records[up_order[i].object][up_order[i].index][0]});
	}
	records_in_order.push({obj: record.object, id: record.id});
	for(let i in down_order){
		records_in_order.push({obj : down_order[i].object, id: records[down_order[i].object][down_order[i].index][0]});
	}
}