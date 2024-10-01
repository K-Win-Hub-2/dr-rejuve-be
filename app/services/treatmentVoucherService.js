'use strict';
const TreatmentSelection = require('../models/treatmentSelection');
const Patient = require('../models/patient');
const TreatmentVoucher = require('../models/treatmentVoucher');
const Attachment = require('../models/attachment');
const Debt = require('../models/debt');
const {createPointHistory} = require('./pointHistoryService');
const {filterFirstPaymentData, filterSecondPaymentData} = require('../helper/treatmentVoucherHelper');
const { AddPointByInput, checkAndUpdateTierOfPatient } = require('../helper/pointHelper');

exports.createTS = async (req, res, next) => {
    let data = req.body
    let files = req.files
    let createdBy = req.credentials.id
    // let { relatedPatient, totalAmount, totalDiscount, totalPaidAmount, multiTreatment, paidAmount, relatedBank, relatedCash, relatedAppointment, bankType, paymentType, remark, relatedDiscount, relatedDoctor } = req.body
    let {
        selections,
        relatedPatient,
        totalAmount,
        totalDiscount,
        totalPaidAmount,
        treatmentReturn,
        refundAmount,
        newTreatmentVoucherCode,
        date,
        type,
        refundVoucherId,
        multiTreatment,
        paidAmount,
        relatedBank,
        relatedCash,
        relatedAppointment,
        bankType,
        paymentType,
        remark,
        relatedDiscount,
        relatedDoctor,
        relatedTherapist,
        discountType
    } = req.body

    let tvcCreate = false;
    let attachID;
    let TSArray = []
    let response = {
        message: 'Treatment Selection create success',
        success: true
    }
    try {
        if (files.payment) {
            for (const element of files.payment) {
                let imgPath = element.path.split('cherry-k')[1];
                const attachData = {
                    fileName: element.originalname,
                    imgUrl: imgPath,
                    image: imgPath.split('\\')[2]
                };
                const attachResult = await Attachment.create(attachData);
                console.log(attachResult, 'result')
                attachID = attachResult._id
            }
        }
        const patientUpdate = await Patient.findOneAndUpdate({
            _id: relatedPatient
        }, {
            $inc: {
                conditionAmount: totalAmount,
                conditionPurchaseFreq: 1,
                conditionPackageQty: 1
            }
        }, {new: true})
        data = {
            ... data,
            createdBy: createdBy,
            tsType: 'TSMulti'
        }
        // Adding TSMulti type
        tvcCreate = true;
        let parsedMulti = JSON.parse(multiTreatment)
        if (treatmentVoucherResult) {
            data = {
                ... data,
                relatedTreatmentVoucher: treatmentVoucherResult._id
            }
        }
        for (const i of parsedMulti) {
            data.multiTreatment = parsedMulti
            data.relatedTreatment = i.item_id
            data.totalAmount = i.price
            data.discount = i.discountAmount
            let result = await TreatmentSelection.create(data)
            TSArray.push(result._id)
        }
        const tsupdate = await Patient.findOneAndUpdate({
            _id: req.body.relatedPatient
        }, {
            $inc: {
                totalTS: TSArray.length,
                unfinishedTS: TSArray.length
            }
        })
        if (tvcCreate === true) { // --> treatment voucher create
            let dataTVC = {
                "VoucherCode": req.body.VoucherCode || null,
                "relatedTreatmentSelection": TSArray,
                "secondAccount": req.body.secondAccount,
                "secondAmount": req.body.secondAmount,
                "isDouble": req.body.isDouble,
                "payment": attachID,
                "deposit": req.body.deposit,
                "remark": req.body.remark,
                "purchaseType": req.body.purchaseType,
                "relatedDoctor": req.body.relatedDoctor,
                "relatedAppointment": relatedAppointment,
                "relatedPatient": relatedPatient,
                "paymentMethod": req.body.paymentMethod, // enum: ['by Appointment','Lapsum','Total','Advanced']
                "totalPaidAmount": paidAmount,
                "relatedBank": relatedBank,
                "bankType": bankType, // must be bank acc from accounting accs
                "paymentType": paymentType, // enum: ['Bank','Cash']
                "relatedCash": relatedCash, // must be cash acc from accounting accs
                "createdBy": createdBy,
                "remark": remark,
                "payment": attachID,
                "relatedTherapist": relatedTherapist || null,
                "relatedDiscount": relatedDiscount,
                "relatedDoctor": relatedDoctor,
                "totalDiscount": totalDiscount,
                "discountType": discountType,
                "discountAmount": req.body.discountAmount,
                "totalAmount": totalAmount,
                "totalPaidAmount": totalPaidAmount,
                "tsType": "TSMulti",
                "createdAt": req.body.createdAt,
                "balance": req.body.balance,
                //with points 
                "add_point": req.body.add_point || false,
                "pay_point_to_customer" : req.body?.pay_point_to_customer || 0,
                "payWithPoint": req.body.payWithPoint || false,
                "total_points": req.body.total_points || 0,
                "discountPercent" : req.body.discountPercent || 0,
                "realTotalAmount": Number(req.body?.realTotalAmount || req.body.totalAmount),
                "giftedPoints": Number(req.body.giftedPoints) || 0,
                "relatedGiftPointRules": req.body.relatedGiftPointRules || null
            }
            console.log(dataTVC)
            dataTVC.multiTreatment = parsedMulti
            let today = new Date().toISOString()
            const latestDocument = await TreatmentVoucher.find({}).sort({seq: -1}).limit(1).exec();
            if (latestDocument.length === 0) 
                dataTVC = {
                    ... dataTVC,
                    seq: 1,
                    code: "TVC-" + "-1"
                }
             // if seq is undefined set initial patientID and seq
            if (latestDocument.length > 0 && latestDocument[0].seq) {
                console.log(latestDocument, 'latestDocument')
                const increment = latestDocument[0].seq + 1
                dataTVC = {
                    ... dataTVC,
                    code: "TVC-" + "-" + increment,
                    seq: increment
                }
            }
            console.log(dataTVC, req.body.VoucherCode, 'DataTVC')
            var treatmentVoucherResult = await TreatmentVoucher.create(dataTVC)
            console.log("this is datava")
            // if work  only payWithPoint activated
            if (req.body.payWithPoint) {
                parsedMulti.map(async (treatment) => {
                    await createPointHistory({type: "point_spent", relatedPatient: req.body.relatedPatient, relatedTreatment: treatment.item_id, point: treatment.point, relatedTreatmentVoucher: treatmentVoucherResult._id})
                })
            }
            //this is from pos input point
            else if(req.body.input_point){
                await createPointHistory({type: "point_earned", relatedPatient: req.body.relatedPatient, point: req.body.input_point, relatedTreatmentVoucher: treatmentVoucherResult._id})
            }
            //this is calculated by rule 
            else if(req.body.add_point && req.body.add_point === "true"){
                await AddPointByInput(req.body.relatedPatient,req.body.pay_point_to_customer)
                await checkAndUpdateTierOfPatient(req.body.relatedPatient)
                await createPointHistory({type: "point_earned", relatedPatient: req.body.relatedPatient, point: req.body.pay_point_to_customer, relatedTreatmentVoucher: treatmentVoucherResult._id, discountPercent: req.body.discountPercent, realTotalAmount: req.body.realTotalAmount, discountTotalAmount: req.body.totalAmount})
            }
        }
        if (treatmentVoucherResult) {
            var populatedTV = await TreatmentVoucher.find({_id: treatmentVoucherResult._id}).populate('relatedDiscount multiTreatment.item_id payment')
        }
        var updatePatient = await Patient.findOneAndUpdate({
            _id: relatedPatient
        }, {
            $addToSet: {
                relatedTreatmentSelection: TSArray
            },
            $inc: {
                conditionAmount: req.body.totalAmount,
                conditionPurchaseFreq: 1,
                conditionPackageQty: 1
            }
        })
        if (req.body.balance > 0) {
            const debtCreate = await Debt.create({"balance": req.body.balance, "relatedPatient": data.relatedPatient, "relatedTreatmentVoucher": treatmentVoucherResult._id})
            var updateDebt = await Patient.findOneAndUpdate({
                _id: relatedPatient
            }, {
                $inc: {
                    debtBalance: req.body.balance
                }
            })
        }

        if (populatedTV) 
            response.treatmentVoucherResult = populatedTV
        
        if (treatmentReturn === "true") {
            let updateRefundInTreatmentVoucherList = await TreatmentVoucher.findByIdAndUpdate(refundVoucherId, {
                Refund: true,
                refundDate: date,
                refundReason: remark,
                refundType: type,
                refundAmount: refundAmount,
                newTreatmentVoucherCode: newTreatmentVoucherCode || null
            })
        }
        res.status(200).send(response);

    } catch (error) {
        console.log(error)
        return res.status(500).send({error: true, message: error.message})
    }
}

exports.filterTreatmentVoucherService = async (data) => {
    let CashListPlusPoint = []
    let BankListPlusPoint = []
    let PointList = []
    let firstBankNames
    let firstCashNames
    let secondBankNames
    let secondCashNames 
    let BankTotal = 0
    let CashTotal = 0
    let PointTotal = 0
    data.Refund = false
    let treatmentVouchers = await TreatmentVoucher.find(data).populate('newTreatmentVoucherId multiTreatment.item_id medicineItems.item_id relatedTreatment secondAccount relatedDoctor relatedBank relatedCash relatedTreatmentSelection relatedPackage relatedPackageSelection relatedTherapist relatedAccounting payment createdBy').populate({
        path: 'relatedTreatmentSelection',
        model: 'TreatmentSelections',
        populate: {
            path: 'relatedAppointments',
            model: 'Appointments',
            populate: {
                path: 'relatedDoctor',
                model: 'Doctors'
            }
        }
    }).populate({
        path: "secondAccount",
        model: "AccountingLists",
        populate: {
            path: "relatedHeader",
            model: "AccountHeaders"
        }
    }).populate({
        path: "repay",
        populate: {
            path: "repayId",
            populate: [
                {
                    path: "relatedTreatmentVoucher"
                }, {
                    path: "relatedPatient"
                }, {
                    path: "relatedBank"
                }, {
                    path: "relatedCash"
                },
            ]
        }
    }).populate({
        path: "relatedPatient",
        populate: {
            path: "relatedTreatmentSelection",
            populate: {
                path: "relatedTreatment"
            }
        }
    }).exec()

    // filter only secondAccount exist that is not point voucher
    let filterOnlySecondAccount = treatmentVouchers.filter(data => data.secondAccount)
    // seperate voucher with respect to point, bank , cash in first payment
    for (let i = 0; i < treatmentVouchers.length; i++) {
        if (treatmentVouchers[i].relatedCash) {
            CashListPlusPoint.push(treatmentVouchers[i])
        } else {
            BankListPlusPoint.push(treatmentVouchers[i])
        }
        //update point array
        if (treatmentVouchers[i].payWithPoint) {
            PointList.push(treatmentVouchers[i])
        }  
    }
    // first payment bankType voucher Data
    let BankList = BankListPlusPoint.filter(b=> !b.payWithPoint)
    let firstBankData = filterFirstPaymentData(BankListPlusPoint, "bank")
    firstBankNames = firstBankData.arrayData
    // first payment bankType voucher Data
    let CashList = CashListPlusPoint.filter(c=> !c.payWithPoint)
    let firstCashData = filterFirstPaymentData(CashListPlusPoint, "cash")
    firstCashNames = firstCashData.arrayData
    let secondPaymentData = filterSecondPaymentData(filterOnlySecondAccount)
    secondBankNames = secondPaymentData.secondBankArray
    secondCashNames = secondPaymentData.secondCashArray
    BankTotal = firstBankData.Total + secondPaymentData.BankTotal
    CashTotal = firstCashData.Total + secondPaymentData.CashTotal
    PointTotal += PointList.reduce((acc, val) => acc + val.total_points, 0)
    return {
        CashList: CashList,
        CashTotal: CashTotal,
        BankList: BankList,
        BankTotal: BankTotal,
        PointList: PointList,
        firstBankNames: firstBankNames,
        firstCashNames: firstCashNames,
        secondBankNames: secondBankNames,
        secondCashNames: secondCashNames,
        PointTotal: PointTotal
    }
}
