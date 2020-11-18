import './template-web'

const strChangeDom = function(dom, str) {
    let div = document.createElement('div').innerHTML = str
    dom.appendChild(div.lastChild)
    div = null
}

export default function(obj) {
    let str = obj.tpl ? template.compile(obj.tpl)(obj.data) : template(obj.id, obj.data)
    let tartgit = document.getElementById(obj.targit)
    obj.isAppend ? strChangeDom(tartgit, str) : tartgit.innerHTML = str
    obj.callback && typeof obj.callback === 'function' ? obj.callback(obj.data) : null
}