import Vue from 'vue'
import App from './App.vue'
import VueAMap from 'vue-amap'
import './assets/style.scss'

Vue.config.productionTip = false
Vue.use(VueAMap);
VueAMap.initAMapApiLoader({
  key: '2392f0c92370767d60d976f09a6bc319',
  plugin: ['Autocomplete', 'PlaceSearch', 'Scale', 'OverView', 'ToolBar', 'MapType', 'PolyEditor', 'AMap.CircleEditor','AMap.Geocoder'],
    // 默认高德 sdk 版本为 1.4.4
  v: '1.4.4'
})

new Vue({
  render: h => h(App),
}).$mount('#app')
