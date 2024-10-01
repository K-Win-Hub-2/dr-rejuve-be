const Booking = require("../models/booking");

exports.createBooking = async (req, res, next) => {
  try {
    // let { treatments, relatedDoctor, relatedPatient } = req.query;

    let data = req.body;
    let booking = new Booking(data);

    console.log(req.body);

    // let query = {
    //   isDeleted: false,
    // };

    // if (treatments) query.service = treatments || "";
    // if (serviceProvider) query.serviceProvider = relatedDoctor || "";
    // if (relatedPatient) query.relatedPatient = relatedPatient | "";
    // if (doctorName) query.doctor = doctorName || "";

    // Generate Booking Number
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, "0");
    const year = String(currentDate.getFullYear());
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const datePart = `${day}${month}${year}`;

    const latestBooking = await Booking.findOne().sort({ createdAt: -1 });
    let sequenceNumber = 1;

    if (latestBooking && latestBooking.bookingNumber) {
      const latestSequence = parseInt(
        latestBooking.bookingNumber.split("-")[2],
        10
      );
      sequenceNumber = latestSequence + 1;
    }

    const sequencePart = String(sequenceNumber).padStart(4, "0");
    booking.bookingNumber = `WBK-${datePart}-${sequencePart}`;

    await booking.save();

    res.status(200).send({
      message: "Booking is created Successfully",
      status: "Pending",
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(200).send({
      error: true,
      status: "Fail",
      message: error.message,
    });
  }
};

exports.listAllBooking = async (req, res, next) => {
  try {
    let { relatedPatient, relatedBranch, startDate, endDate } = req.query;
    let query = { isDeleted: false };

    if (relatedPatient) query.relatedPatient = relatedPatient;
    if (relatedBranch) query.relatedBranch = relatedBranch;

    if (startDate && endDate) {
      const startDay = new Date(startDate);
      const endDay = new Date(endDate);
      startDay.setHours(0, 0, 0, 0);
      endDay.setHours(23, 59, 59, 999);

      const filterByDate = {
        date: {
          $gte: startDay,
          $lte: endDay,
        },
      };

      query = { ...query, ...filterByDate };
    }

    let queryBooking = await Booking.find(query)
      .populate("relatedPatient")
      .populate([
        {
          path: "service",
          populate: [
            { path: "treatmentName" },
            { path: "relatedDoctor" },
            { path: "procedureMedicine", populate: { path: "item_id" } },
            { path: "procedureAccessory", populate: { path: "item_id" } },
            { path: "medicineLists", populate: { path: "item_id" } },
          ],
        },
        {
          path: "serviceProvider",
        },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).send({
      success: true,
      data: queryBooking,
    });
  } catch (error) {
    res.status(500).send({
      error: true,
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getBookingById = async (req, res, next) => {
  try {
    let { id } = req.params;
    console.log("thisi is", id);
    let queryBookingById = await Booking.findOne({ _id: id })
      .populate("relatedPatient")
      .populate([
        {
          path: "service",
          populate: [
            { path: "treatmentName" },
            { path: "relatedDoctor" },
            { path: "procedureMedicine", populate: { path: "item_id" } },
            { path: "procedureAccessory", populate: { path: "item_id" } },
            { path: "medicineLists", populate: { path: "item_id" } },
          ],
        },
        {
          path: "serviceProvider",
        },
      ]);
    return res.status(200).send({
      success: true,
      data: queryBookingById,
    });
  } catch (error) {
    res.status(200).send({
      error: true,
      status: "Fail",
      message: error.message,
    });
  }
};

exports.updateBookingById = async (req, res, next) => {
  try {
    let { id } = req.params;
    let { status } = req.query;
    let data = req.body;

    let updateBookingById = await Booking.findByIdAndUpdate(
      id,
      {
        $set: { ...data, status: status },
      },
      {
        new: true,
      }
    )
      .populate("relatedPatient")
      .populate([
        {
          path: "service",
          populate: [
            { path: "treatmentName" },
            { path: "relatedDoctor" },
            { path: "procedureMedicine", populate: { path: "item_id" } },
            { path: "procedureAccessory", populate: { path: "item_id" } },
            { path: "medicineLists", populate: { path: "item_id" } },
          ],
        },
        {
          path: "serviceProvider",
        },
      ]);

    // let updatedBookingById = await Booking.findById(id);
    return res.status(200).send({
      status: "Booking Updated Successfully",
      success: true,
      data: updateBookingById,
    });
  } catch (error) {
    res.status(200).send({
      error: true,
      status: "Fail",
      message: error.message,
    });
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    let { id } = req.params;
    let deleteBookingById = await Booking.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        status: "Cancelled",
      },
      { new: true }
    );

    if (!deleteBookingById) {
      return res.status(200).send({
        status: "Booking Not Found",
        success: false,
      });
    }

    return res
      .status(200)
      .send({ status: "Deleted Successfully", success: true });
  } catch (error) {
    res.status(200).send({
      error: true,
      status: "Fail To Delete",
      message: error.message,
    });
  }
};
