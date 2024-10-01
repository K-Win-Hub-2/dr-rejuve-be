exports.filterFirstPaymentData = (arrayList, data)=>{
    let arrayData = []
    let Total = 0
    let TotalData = arrayList.reduce((total, acc)=>{
        switch (data){
            case "bank":
                total[acc.relatedBank.name] = (total[acc.relatedBank.name] || 0) + (acc.totalPaidAmount || 0) + (acc.msPaidAmount || 0)
                break;
            case "cash":
                total[acc.relatedCash.name] = (total[acc.relatedCash.name] || 0) + (acc.totalPaidAmount || 0) + (acc.msPaidAmount || 0)
                break;
            default:
                total[acc.relatedCash.name] = (total[acc.relatedCash.name] || 0) + (acc.totalPaidAmount || 0) + (acc.msPaidAmount || 0)
        }
        return total
    },{})
    Object.entries(TotalData).forEach(([key,value])=>{
        Total += value
        arrayData.push({bankname: key, amount: value})
    })
    return { arrayData: arrayData, Total: Total }
}

exports.filterSecondPaymentData = (arrayList)=>{
    let secondBankArray = []
    let secondCashArray = []
    let BankTotal = 0
    let CashTotal = 0
    let secondAccountData = arrayList.reduce((total, acc)=>{
        if(acc.secondAccount && acc.secondAccount.relatedHeader && acc.secondAccount.relatedHeader.name === "Cash at Bank"){
            total[acc.secondAccount.name] = (total[acc.secondAccount.name] || 0) + ( acc.secondAmount || 0 )
        }else if(acc.secondAccount && acc.secondAccount.relatedHeader && acc.secondAccount.relatedHeader.name === "Cash in Hand"){
            total[acc.secondAccount.name] = (total[acc.secondAccount.name] || 0) + ( acc.secondAmount || 0 )
        }
        return total
    },{})
    Object.entries(secondAccountData).forEach(([key,value])=>{
        if(key.split(" ").join("").toLowerCase() === "cashinhand"){
            CashTotal += value
            secondCashArray.push({cashname: key, amount: value})
        }else{
            BankTotal += value
            secondBankArray.push({bankname: key, amount: value})
        }
    })
    return { secondCashArray: secondCashArray, secondBankArray: secondBankArray, BankTotal: BankTotal, CashTotal: CashTotal }
}