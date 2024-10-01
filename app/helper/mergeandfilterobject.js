exports.filterNullValue = (obj) => {
    return Object.fromEntries(Object.entries(obj).filter(([_,value]) => value != null))
}

exports.mergeObject = (defaultObject, obj) => {
    return Object.keys(defaultObject).reduce((acc, key)=>{
        if(obj.hasOwnProperty(key)){
            acc[key] = obj[key]
        }
        return acc
    },{})
}