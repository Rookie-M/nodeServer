var XLSX = require('xlsx');
const axios = require('axios');

axios.defaults.baseURL = 'https://restapi.amap.com/v3';
axios.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
})
//总围栏数
var fenceNum = 0;
//区域片数
var mixNum = 30;

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
            fence.id = num*i+j;
            fence['经度Min'] = _fence[2] + lat * i;
            fence['纬度Min'] = _fence[3] + lng * j;

            fence['经度Max'] = _fence[2] + lat * (i + 1);
            fence['纬度Max'] = _fence[3] + lng * (j + 1);
            //TODO
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
            weilanData[i]['最终社区'] = 0;
        }

    })
    if(Math.max.apply({},areaSku) > 500) {
        run();
    }else {
        console.log('分区完毕');
        combinFence();
        writeXLXSFile();
    }



}

function combinFence() {
    let circle = 3, max = 500;

    weilanData.sort((a,b) => (b.sku - a.sku));
    weilanData.forEach((item, i) => {
        if(item.checked == 1) return;
        //标记
        fenceNum ++ ;
        weilanData[i]['checked'] = 1;
        let name = item.name.split('-');

        let initSku = item.sku;
        //sku 限制 圈数
        item.sku >= 300 && (circle = 3);
        item.sku < 300 && (circle = 5);

        for(let j = 1; j<= circle;j++) {
            //获取周边子社区
            let group = getAroundGroup(+name[1],+name[2], j);
            if(group.length > 0) {
                // 周边社区按sku降序排序
                group.sort((a,b) => (b.value.sku - a.value.sku ));
                for(let _l = 0; _l < group.length; _l++){
                    let area = group[_l];
                    if(area.value.sku + initSku <= max){
                        weilanData[area.key]['checked']  = 1;
                        initSku += area.value.sku;
                        weilanData[i]['最终社区'] = fenceNum;
                        weilanData[area.key]['最终社区'] = fenceNum;
                    }
                }
            }
        }

        if(initSku == item.sku) {
            weilanData[i]['最终社区'] = fenceNum;
        }
        
    })

    weilanData.sort((a,b) => (b['最终社区'] - a['最终社区']));

}

function getAroundGroup(x,y,circle){
    let group = [];

    //TODO
    let x1 = x - circle > 0 ? (x - circle) : 0;
    let x2 = x + circle <= 52 ? (x + circle) : 52;
    let y1 = y - circle > 0 ? (y - circle) : 0;
    let y2 = y + circle <= 52 ? (y + circle) : 52;
    weilanData.forEach((item, i) => {
        if(item.checked == 1) return;
        let name = item.name.split('-');
        let a = name[1], b = name[2];
        if( a >= x1 && a <= x2 && b >= y1 && b <= y2) {
            group.push({
                key: i,
                value: item
            })
        }
    })
    return group;
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



