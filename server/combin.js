var XLSX = require('xlsx');
const axios = require('axios');

axios.defaults.baseURL = 'https://restapi.amap.com/v3';
axios.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
})
//区域片数
var mixNum = 30

//区域围栏分布
var weilanData = [];
// 所有区域数据
var weilanSource = [];

var workbook = XLSX.readFile('./assets/fenceSource.xlsx');
workbook.SheetNames.forEach(name => {
    weilanSource = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
});

function run() {
    mixNum +=1;
    weilanData = mixFence(mixNum);
    getFenceSource();
    fenceSkuJudge();
}

function getFenceSource(){
    //命中围栏
    weilanSource.forEach((source, i) => {
        
        let weilan = weilanData.filter(fence => {
            let a = source['经度'], b = source['纬度'];
            return a<= fence['经度Max'] && a >= fence['经度Min'] && b<= fence['纬度Max'] && b >= fence['纬度Min'];
        });

        if(weilan.length > 0) {
            weilan = weilan[0];
            weilanSource[i]['社区编号'] = weilan.name;
            weilanSource[i]['id'] = weilan.id;
        }else {
            throw new Error('impossible')
        }
    })
}


// 区域划分
function mixFence(num) {
    let fences = [];
    let _fence = [120.914545,37.017621,119.794281,35.786163];
    let lat = (_fence[0] - _fence[2])/num;
    let lng = (_fence[1] - _fence[3])/num;

    for(let i = 0;i< num; i++) {
        for(let j = 0; j< num;j++){
            let fence = {
                name: '社区-'+ String(i + 1) +'-' +  String(j + 1),
            };
            fence['经度Min'] = _fence[2] + lat * i;
            fence['纬度Min'] = _fence[3] + lng * j;

            fence['经度Max'] = _fence[2] + lat * (i + 1);
            fence['纬度Max'] = _fence[3] + lng * (j + 1);
            //TODO
            // fence.id = num*i+j;
            fences.push(fence);
        }
        
    }

    return fences;
}
//区域suk
function fenceSkuJudge() {
    var areaSku = [];
    weilanData.forEach((fence,i) => {
        
        let sources = weilanSource.filter(source => source.id == fence.id);
        if(sources.length > 0){
            let sku = sources.reduce((a,b) => (a + b.sku),0);
            areaSku.push(sku);
            weilanData[i]['sku'] = sku;
            weilanData[i]['checked'] = 0;
        }else{
            weilanData[i]['sku'] = 0;
            weilanData[i]['checked'] = 1;
        }

    })
    if(Math.max.apply({},areaSku) > 500) {
        run();
    }else {
        combinFence()
        writeXLXSFile();
    }



}

function combinFence() {
    let circle = 3, max = 500;
    weilanData.sort((a,b) => (b.sku - a.sku));


}

function writeXLXSFile() {
    const ws = XLSX.utils.json_to_sheet(weilanSource);
    const ws2 = XLSX.utils.json_to_sheet(weilanData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "社区列表");
    XLSX.utils.book_append_sheet(wb, ws2, "社区围栏");
    /* generate file and send to client */
    XLSX.writeFile(wb, "./assets/fenceSkuData.xlsx");

}

//start
run();



