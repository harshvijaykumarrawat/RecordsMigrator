let sketch_json = document.getElementById('sketch_json');
let mode2_step1_submit = document.getElementById('mode2_step1_submit');

mode2_step1_submit.onclick = function(element) {
	
	let sketchValue = sketch_json.innerHTML.trim();
	if(sketchValue != null){
		try{
			let sketch = json.parse(sketchValue);
			initModeTwo(sketch);
		}catch(ex){
			console.log('Bad JSON');
			return;
		}
	}else{
		console.log('Bad JSON');
		return;
	}
};

function initModeTwo(sketch){
	
}