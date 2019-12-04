var XLSX = require('xlsx');
const axios = require('axios');
const path = require('path')

axios.defaults.baseURL = 'https://restapi.amap.com/v3';
axios.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
})
var latMix = 0;
var lngMix = 0;

//栅格数据
var weilanData = [];

// 原始xlsx数据
var gridSource = [];

var gridArea = [];

//前置仓位置
var frontCan = [
    { lng: 120.355989, lat: 36.101725 },

    { lng: 120.451344, lat: 36.101326 },
    { lng: 120.407342, lat: 36.165012 },
    { lng: 120.529952, lat: 36.156492 },
    { lng: 120.398667914286, lat: 36.2869947272727 },
    { lng: 120.459221657143, lat: 36.3989345 },
]

var workbook = XLSX.readFile(_resolve('./assets/ch-dataGroup.xlsx'));
gridSource = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
let lngs = gridSource.map(item => item['经度']);
let lats = gridSource.map(item => item['纬度']);
gridArea.push(Math.max.apply(null, lngs), Math.max.apply(null, lats), Math.min.apply(null, lngs), Math.min.apply(null, lats));
// Y
lngMix = getMixNum({ lng: gridArea[2], lat: gridArea[3] }, { lng: gridArea[0], lat: gridArea[3] });
// X
latMix = getMixNum({ lng: gridArea[2], lat: gridArea[3] }, { lng: gridArea[2], lat: gridArea[1] });
// TODO
console.log(gridArea, 'Y:' + lngMix, "X:" + latMix);
// console.log(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]), lngs, lats, gridArea);

function run() {
    weilanData = mixFence();
    getFenceSource();
    fenceSkuJudge();
}

function getFenceSource() {
    //命中围栏
    gridSource.forEach((source, i) => {

        let weilan = weilanData.filter(fence => {
            let a = source['经度'], b = source['纬度'];
            return a <= fence['经度Max'] && a >= fence['经度Min'] && b <= fence['纬度Max'] && b >= fence['纬度Min'];
        });

        if (weilan.length > 0) {
            weilan = weilan[0];
            gridSource[i]['栅格编号'] = weilan.name;
        } else {
            throw new Error('impossible')
        }
    })
}


// 区域划分
function mixFence() {
    let fences = [];
    let _fence = gridArea;
    let lat = (_fence[1] - _fence[3]) / latMix;
    let lng = (_fence[0] - _fence[2]) / lngMix;

    for (let i = 0; i < lngMix; i++) {
        for (let j = 0; j < latMix; j++) {
            let fence = {
                name: '栅格-' + String(i + 1) + '-' + String(j + 1),
            };
            fence['经度Min'] = _fence[2] + lng * i;
            fence['纬度Min'] = _fence[3] + lat * j;

            fence['经度Max'] = _fence[2] + lng * (i + 1);
            fence['纬度Max'] = _fence[3] + lat * (j + 1);
            //TODO
            fences.push(fence);
        }

    }
    // console.log(fences)

    return fences;
}
//区域suk
function fenceSkuJudge() {
    weilanData.forEach((fence, i) => {
        let sources = gridSource.filter(source => source['栅格编号'] == fence['name']);
        if (sources.length > 0) {
            // let sku = sources.reduce((a, b) => (a + b['数量匹配']), 0);
            let sku = sources.reduce((a, b) => (a + b.sku), 0);
            fence.sku = sku;
            fence['小区个数'] = sources.length;
        } else {
            fence.sku = 0;
            fence['小区个数'] = 0;
        }

    })

    // findArea();
    writeXLXSFile();
}
//查找前置仓区域
function findArea() {
    frontCan.forEach((center, i) => {
        gridSource.forEach(source => {
            let a = source['前置仓库'];
            if (a && a > 0) {
                return;
            }
            let bool = getMixNum(center, { lng: source['经度'], lat: source['纬度'] });//500m的倍数

            if (bool < 10) {  //小于5km
                source['前置仓库'] = i + 1;
            }
            else {
                source['前置仓库'] = 0;
            }
        })
    })
}

//导出xlsx
function writeXLXSFile() {
    const ws = XLSX.utils.json_to_sheet(gridSource);
    const ws2 = XLSX.utils.json_to_sheet(weilanData);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "社区列表");
    XLSX.utils.book_append_sheet(wb, ws2, "社区围栏");
    /* generate file and send to client */
    XLSX.writeFile(wb, _resolve("./assets/ch-distanceParse.xlsx"));

}


function _resolve(_path) {
    return path.resolve(__dirname, _path)
}
function getMixNum(location1, location2) {
    let baseRad = Math.PI * location1.lat / 180;
    let targetRad = Math.PI * location2.lat / 180;
    let theta = location1.lng - location2.lng;
    let thetaRad = Math.PI * theta / 180;

    let dist = Math.sin(baseRad) * Math.sin(targetRad) + Math.cos(baseRad) * Math.cos(targetRad) * Math.cos(thetaRad);
    dist = Math.acos(dist);

    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515 * 1.609344;
    // result = new Distance(dist, Unit.Kilometer);
    return Math.ceil(dist * 1000 / 500)
}

//start
run();



