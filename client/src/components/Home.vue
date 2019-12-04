<template>
  <div class="home">
      <el-amap vid="amap" map-style="normal" class="amap" :amap-manager="amapManager" :zoom="zoom" :events="mapEvents">
            <!-- 1 小区-->
            <el-amap-circle :bubble="true" v-for="(circle,index) in circles" :center="circle.center" :radius="circle.radius" :fill-opacity="circle.fillOpacity"  stroke-opacity="0" :visible="circle.storage.length === 0" :vid="index" :key="index+'a'"></el-amap-circle>
            
            <!-- 2 前置仓库-->
            <el-amap-circle :bubble="true" v-for="(circle,index) in storageCircle" :center="circle.center" :radius="circle.radius" :fill-opacity="circle.fillOpacity" :fill-color="circle.fillColor"  stroke-opacity="0" :events="circle.events" :editable="circle.editable" :vid="index" :ext-data="circle.id" :key="index+'b'"></el-amap-circle>

            <!-- 3 -->
            <!-- <el-amap-marker bubble="{{true}}" v-for="(marker, index) in markers" :position="marker.position" :visible="marker.visible"  :vid="index"></el-amap-marker> -->
        </el-amap>
        <div class="info-box">
            <div class="title">前置仓库 <span @click="fireStorage">添加</span></div> 
            <div class="list">
                <div class="item" v-for="(item, index) in storageCircle" :class="{active: item.editable}"  @click="checkIndex(index)" :key="item.id">
                    <div class="t1">地址：{{item.address}}</div>
                    <div class="t2">覆盖小区数量：{{item.cover}}</div>
                    <div class="t2">覆盖sku：{{item.sku}}</div>
                </div>
            </div>
            <div class="info">
                <p>小区总数量：{{circles.length}}；</p>
                <p>sku：{{sku}}</p>
                <span @click="save">记录</span>
            </div> 
        </div>
  </div>
</template>

<script>
import { AMapManager } from 'vue-amap';
import * as Service from '@/service/index.js'
// import { constants } from 'fs';
let amapManager = new AMapManager();
export default {
    name: 'Home',
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
    computed: {
        sku: function() {
            return this.circles.reduce((a,b)=> a+ b.sku,0)
        }
    },
    methods: {
        getData: function() {
            Service.getMapResource().then(res => {
                this.circles = res.data.map(item => {
                    return {
                        name: item['社区名称'],
                        center: [item['经度'], item['纬度']],
                        radius: item.sku +100,
                        fillOpacity: 0.5,
                        strokeOpacity: 0,
                        sku: item.sku,
                        storage: []
                    }
                });

            })
        },
        save: function(){
            Service.saveData({
                storage: this.storageCircle.map(item => {
                    return {
                        id: item.id,
                        '地址': item.address,
                        '经度': item.center[0],
                        '纬度': item.center[1],
                        '半径': item.radius,
                        '覆盖小区数量': item.cover,
                        '覆盖sku': item.sku,
                    }
                })
            }).then(res => {
                console.log(res)
                // window.open('http://192.168.0.196:3000/download', '_blank')
                window.open('http://localhost:3000/download', '_blank')
            })
        },
        fireStorage: function() {
            this.mapClick = true;
            alert('点击地图添加前置仓！')
        },
        checkIndex: function(index) {
            if(this.editCircleIndex === index) {
                this.storageCircle[index].editable = false;
            }else {
                this.editCircleIndex = index;
                this.storageCircle[index].editable = true;
            }

        },
        setStorage: function(pos) {
            this.mapClick = false;
            var lnglat = [pos.getLng(),pos.getLat()];
            
            AMap.plugin('AMap.Geocoder', ()=> {
                var geocoder = new AMap.Geocoder({
                  city: '武汉市'
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
                        address: result.regeocode.formattedAddress,
                        editable: false,
                        center: lnglat,
                        radius: 5000,
                        fillColor: '#00a2eb',
                        fillOpacity: 0.5,
                        strokeOpacity: 0,
                        cover: arr.length,
                        sku: arr.reduce((a,b) => a + b.sku,0),
                        events: {
                            end: (e) => {
                               if(this.editCircleIndex > -1) {
                                   this.editStorage(e.target.getCenter(),this.editCircleIndex);
                                   this.editCircleIndex = -1;
                               }else {
                                //    console.log('add_end',this.storageCircle)
                               }
                            },
                            move: e=> {
                                this.moveStorage(e.lnglat, this.editCircleIndex);
                            }
                        }
                    })
                  }else {
                    console.log('fail',result)
                  }
                })
              })
        },
        editStorage: function(pos, i) {
            var lnglat = [pos.getLng(),pos.getLat()];
            AMap.plugin('AMap.Geocoder', ()=> {
                var geocoder = new AMap.Geocoder({
                  city: '武汉市'
                })
                geocoder.getAddress(lnglat, (status, result)=> {
                  if (status === 'complete' && result.info === 'OK') {
                    let arr = this.circles.filter((item) => {
                        if(pos.distance(item.center) < 5000) {
                            item.storage.pop();
                            item.storage.push(result.regeocode.addressComponent.adcode)
                            return 1;
                        }
                        return 0
                    })
                    let circle = {...this.storageCircle[i],
                        id:result.regeocode.addressComponent.adcode,
                        center: lnglat,
                        address: result.regeocode.formattedAddress,
                        cover: arr.length,
                        sku: arr.reduce((a,b) => a + b.sku,0),
                    }
                    this.storageCircle[i] = circle;
                    this.storageCircle = this.storageCircle.slice(0);

                  }else {
                    console.log('fail',result)
                  }
                })
              })
        },
        moveStorage: function(pos,i) {
            var lnglat = [pos.getLng(),pos.getLat()];
            let circle = {...this.storageCircle[i],
                id:"_move"+ new Date().getTime(),
                center: lnglat,
            }
            let arr = this.circles.filter((item) => {
                let index = item.storage.indexOf(this.storageCircle[i].id);
                if(index > -1) {
                    item.storage.splice(index,1);
                }
                if(pos.distance(item.center) < 5000) {
                    item.storage.push(circle.id);
                    return 1;
                }
                return 0
            })
            circle = {...circle,
                cover: arr.length,
                sku: arr.reduce((a,b) => a + b.sku,0),
            }
            this.storageCircle[i] = circle;
            this.storageCircle = this.storageCircle.slice(0);
        }
    },
    created: function() {
        this.getData();
        
    },
    mounted: function() {
        
    }
}
</script>

<style  lang="scss">
.home{
    height: 100vh;
    .amap{
        width: calc(100vw - 100px);
        width: 100vw;
        height: 100vh;
    }
        .info-box{
            position: absolute;
            left: 20px;
            top: 50px;
            background: #fff;
            width: 500px;
            box-shadow: 0 0 5px 0px rgba(0,0,0,.3);
            .title{
                padding: 15px 20px;
                span{
                    float: right;
                    width: 60px;
                    background: #00a2eb;
                    color: #fff;
                    text-align: center;
                    cursor: pointer;
                    line-height: 24px;
                    font-size: 12px;
                }
            }
            .list{
                padding-bottom: 15px;
                .item{
                    padding: 10px;
                    margin: 10px;
                    background: #fafafa;
                    font-size: 12px;
                    cursor: pointer;
                    &.active{
                        background: #f89191
                    }
                    .t1{
                        font-size: 14px;
                    }
                    .t2{
                        display: inline-block;
                        margin-right: 10px;
                    }
                }
            }
            .info{
                border-top: 1px solid #000;
                padding: 10px 20px;
                font-size: 14px;
                p{
                    display: inline-block;
                    margin-right: 10px;
                }
                span{
                    float: right;
                    width: 60px;
                    background: #eb7200;
                    color: #fff;
                    text-align: center;
                    cursor: pointer;
                    line-height: 24px;
                    font-size: 12px;
                }
            }
        }
        
}
</style>
