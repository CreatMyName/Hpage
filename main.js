import loadRender from './src/render'
import Hdrive from './src/Observe'
const Hpage = class {
    constructor(obj){
        /** 加载混入 */
        this.initMinx(this)
        // 注册data
        this.initData(obj.data, this)
        /** 注册methods */
        this.initMethods(obj.methods, this)
        obj.onStart && typeof obj.onStart === 'function' ? obj.onStart.call(this) : null
        this.defRender(obj.staticRender, this)
        // this.onStart()
        /** 注册监听 */
        this.dirvePage(obj.bindView, this)
        this.$refs = {}
        if(!obj.isComp){
            window.hpage = this
        }
        this.components.forEach(item=>{
            this[item.name] = item.load(this)
        })
        this.getElementByAttribute(this, 'ref')
        obj.finish && typeof obj.finish === 'function' ? obj.finish.call(this) : null
        this.minx.forEach(item => {
            item.finish && typeof item.finish === 'function' ? item.finish.call(this) : null
        })
    }
    /** 合并data */
    initData(data, scope){
        for(var key in data){
            key in scope ? null : scope[key] = data[key]
        }
    }
    /** 合并methods */
    initMethods(methods,scope){
        scope['methods'] = scope.methods || {}
        scope['_methods'] = Object.assign(scope.methods, methods)
        for(var key in methods){
            key in scope ? null : scope[key] = methods[key]
        }
    }
    /** 初始化混入 */
    initMinx(scope){
        scope['methods'] = scope.methods || {}
        this.setRefs(scope)
        this.minx.forEach(item => {
            this.initData(item.data, scope)
            this.initMethods(item.methods, scope)
            this.defRender(item.staticRender, scope)
            this.dirvePage(item.bindView, scope)
            item.onStart && typeof item.onStart === 'function' ? item.onStart.call(this) : null
        })
    }
    setRefs(scope){
        scope['$refs'] = {}
        this.getElementByAttribute(scope, 'ref')
    }
    /** 手动加载板块 */
    loadMinx(name){
        /** 重新加载 */
        if(name in this){
            /** 重新获取ref 避免使用的ref过期 */
            this.setRefs(this[name])
            this[name].beforeMinx()
            this[name].reload()
            this[name].finish()
            return 
        }
        /** 混入前执行 */
        /** 创建this的子模块 */
        this[name] = this[name] || {}
        let scope = this[name]
        scope['$parent'] = scope['$parent'] || this
        scope['methods'] = scope['methods'] || {}
        this.setRefs(scope)
        scope.beforeMinx = 'beforeMinx' in this.afterMinx[name] && typeof this.afterMinx[name].beforeMinx === 'function' ? () => this.afterMinx[name].beforeMinx.call(this[name], this) : ()=>{}
        scope.beforeMinx()
        /** 子模块附加ref */
        /** 初始化参数 */
        this.initData(this.afterMinx[name].data, scope)
        this.initMethods(this.afterMinx[name].methods, scope)
        /** 静态渲染 */
        this.defRender(this.afterMinx[name].staticRender, scope)
        /** 启子模块 */
        scope.reload = this.afterMinx[name].onStart && typeof this.afterMinx[name].onStart === 'function' ? () => this.afterMinx[name].onStart.call(this[name], this) : ()=>{}
        scope.reload()
        /** 安装驱动 */
        this.dirvePage(this.afterMinx[name].bindView, scope)
        /** 完成 */
        scope.finish = this.afterMinx[name].finish && typeof this.afterMinx[name].finish === 'function' ? () => this.afterMinx[name].finish.call(this[name], this) : ()=>{}
        scope.finish()
    }
    /** 获取ref标记的dom */
    getElementByAttribute(scope, attr, root) {
        root = root || document.body;
        if(root.hasAttribute(attr)) {
            scope.$refs[root.getAttribute(attr)] = root;
        }
        var children = root.children;
        for(var i = children.length; i--; ) {
            this.getElementByAttribute(scope, attr, children[i]);
        }
    }
    defRender(staticRender, scope){
        if(staticRender&&Array.isArray(staticRender)){
            staticRender.forEach(elem => {
                let config = {
                    targit: elem.to,
                    id: elem.from,
                    tpl: elem.tpl || null,
                    data: scope,
                    isAppend: elem.isAppend || false,
                    callback: elem.result || null
                }
                loadRender(config)
            })
        }
    }
    /** 注册驱动和渲染 */
    dirvePage(bindView, scope){
        bindView = bindView || []
        /** 驱动设置参数 */
        scope._bindView = scope._bindView || []
        bindView.forEach(item=> {
            scope._bindView.push(Object.assign({}, item))
        })
        scope._bindView.forEach(item => {
            let configs = []
            item.renders.forEach(elem => {
                let config = {
                    targit: elem.to,
                    id: elem.from,
                    tpl: elem.tpl || item.tpl || null,
                    data: {},
                    isAppend: elem.isAppend || item.isAppend || false,
                    callback: elem.result || item.result || null
                }
                config.data[item.bind] = scope[item.bind]
                configs.push(config)
            })
            const render = () => {
                configs.forEach(config => { loadRender(config) })
            }
            Hdrive(scope, item.bind, render)
        })
    }
}
Hpage.prototype.components = []
Hpage.prototype.minx = []
Hpage.prototype.afterMinx = {}
/** 组件注册接口 */
Hpage.use = function(obj){
    if (!obj.name) return console.warn(`注册的组件缺少name，本次注册无效！`)
    if(Hpage.prototype.components.some(item => { return item.name === obj.name })) 
        return console.warn(`组件name=${obj.name}已被注册，本次注册无效！`)
    let newComp = Object.assign({ isComp: true }, obj)
    Hpage.prototype.components.push({
        name: obj.name,
        load: function(parent){
            let constructor = Object.assign({ $parent:parent }, newComp)
            return new Hpage(constructor)
        }
    })
}
/** 混入接口 */
Hpage.minx = function(obj){
    Hpage.prototype.minx.push(obj)
}
/** 手动混入接口 */
Hpage.afterMinx = function(name,obj) {
    name in Hpage.prototype.afterMinx ? 
    console.error(`afterMinx 已注册有 ${name} 实例`) :
    Hpage.prototype.afterMinx[name] = obj
}
/** 数据设置 */
Hpage.prototype.toData = function(val,key){
    if(!key) return console.error('toData 方法未找到入口key!')
    let _pro = this;
    if(!key.includes('.')){
        key in this ? this[key] = val : null
        return 
    }
    let isurl = key.split('.')
    isurl.forEach((i, c) => {
        c === isurl.length-1 ? _pro[i] = val : (i in _pro ? _pro = _pro[i] : null)
    })
}
export default Hpage