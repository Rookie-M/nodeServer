// 初始化高德地图的 key 和插件
VueAMap.initAMapApiLoader({
    key: '2392f0c92370767d60d976f09a6bc319',
    plugin: ['Autocomplete', 'PlaceSearch', 'Scale', 'OverView', 'ToolBar', 'MapType', 'PolyEditor', 'AMap.CircleEditor','AMap.Geocoder'],
    // 默认高德 sdk 版本为 1.4.4
    uiVersion: '1.0.11',
    v: '1.4.4'
});
let amapManager = new VueAMap.AMapManager();
var app = new Vue({
    el: '#app',
    data(){
        return {
            amapManager,
            mapClick: false,
            editCircleIndex: -1,
            zoom:12,
            radius:50,
            circles: [],
            markers: [],
            storageCircle: [],
            mapEvents: {
                click: (e) => {
                    if(!this.mapClick) return;
                    this.setStorage(e.lnglat)
                }
            }
        }
    },
    methods: {
        getData: function() {
            axios.get('/mapData').then(res => {
                this.circles = res.data.map(item => {
                    return {
                        center: [item['经度'], item['纬度']],
                        radius: item.sku +100,
                        fillOpacity: 0.5,
                        strokeOpacity: 0,
                        events: {
                            click: (e) => {
                                console.log(e.target);
                            }
                        },
                        sku: item.sku,
                        storage: []
                    }
                });

            })
        },
        fireStorage: function() {
            this.mapClick = true;
            alert('点击地图添加前置仓！')
        },
        editCircle: function(index) {
            this.storageCircle[index].editable = true;
        },
        setStorage: function(pos) {
            this.mapClick = false;
            var lnglat = [pos.getLng(),pos.getLat()];
            
            AMap.plugin('AMap.Geocoder', ()=> {
                var geocoder = new AMap.Geocoder({
                  city: '青岛市'
                })
                geocoder.getAddress(lnglat, (status, result)=> {
                  if (status === 'complete' && result.info === 'OK') {
                    let arr = this.circles.filter((item) => {
                        if(pos.distance(item.center) < 5000) {
                            item.storage.push(result.regeocode.addressComponent.adcode);
                            return 1;
                        }
                        return 0
                    })
                    this.storageCircle = this.storageCircle.concat({
                        id:result.regeocode.addressComponent.adcode,
                        editable: false,
                        center: lnglat,
                        radius: 5000,
                        fillColor: '#00a2eb',
                        fillOpacity: 0.5,
                        strokeOpacity: 0,
                        address: result.regeocode.formattedAddress,
                        cover: arr.length,
                        sku: arr.reduce((a,b) => a + b.sku,0),
                        events: {
                            end: (e) => {
                                console.log('mousedown_getExtData',e.target.getExtData())
                            }
                        }
                    })
                  }else {
                    console.log('fail',result)
                  }
                })
              })
        }
    },
    created: function() {
        axios.defaults.baseURL = 'http://192.168.0.196:3000';
        axios.interceptors.request.use(config => {
            config.headers['Content-Type'] = 'application/json;charset=UTF-8';
            return config;
        });
        this.getData();
        
    },
    mounted: function() {
        
    }
})