"use strict"

class RegisterApiServices {
    constructor() {
        this.methods = []
        if (RegisterApiServices.instance instanceof RegisterApiServices) {
            return RegisterApiServices.instance;
        }
        RegisterApiServices.instance = this
}
getMethods(name){
    return this.methods.map(obj=> Object.fromEntries(Object.entries(obj).filter(([firstKey,value])=>{
        if(firstKey === name) return obj[firstKey]
    })))
}
setMethods(obj){
    this.methods.push(obj)
}
}

module.exports = new RegisterApiServices()
