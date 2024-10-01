const adminTreatmentModel = require("../models/adminTreatmentModel");
const fs = require("fs");
const path = require("path");

exports.getAllTreatment = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const totalTreatments = await adminTreatmentModel
      .find({ isDeleted: false })
      .countDocuments();

    const treatments = await adminTreatmentModel
      .find({ isDeleted: false })
      .skip((page - 1) * limit)
      .limit(limit);

    const division = totalTreatments / limit;
    const totalPages = Math.ceil(division);

    return res.status(200).json({
      success: true,
      count: totalTreatments,
      _metadata: {
        current_page: page,
        per_page: limit,
        page_count: totalPages,
        total_count: totalTreatments,
      },
      list: treatments,
    });
  } catch (err) {
    return res
      .status(500)
      .send({ error: true, message: "Error on Retrieving Treatments" });
  }
};

exports.getTreatmentByID = async (req, res, next) => {
  const { id } = req.params;

  try {
    const treatment = await adminTreatmentModel.findById(id);

    if (!treatment) {
      return res
        .status(404)
        .json({ error: true, message: "Treatment not found" });
    }

    return res.status(200).json({ success: true, data: treatment });
  } catch (error) {
    return res
      .status(500)
      .send({ error: true, message: "Error on Retrieving Treatment" });
  }
};

exports.getALLMainTreatment = async (req, res, next) => {
  try {
    // Fetch all treatments that are not deleted
    const treatments = await adminTreatmentModel.find({ isDeleted: false });

    // Group treatments by treatmentName
    const groupedTreatments = treatments.reduce((acc, treatment) => {
      const { treatmentName } = treatment;
      if (!acc[treatmentName]) {
        acc[treatmentName] = [];
      }
      acc[treatmentName].push(treatment);
      return acc;
    }, {});

    // Separate treatments into two arrays: one for multiple entries and one for single entries
    const multipleEntries = [];
    const singleEntries = [];

    Object.keys(groupedTreatments).forEach((treatmentName) => {
      const treatmentsArray = groupedTreatments[treatmentName];
      if (treatmentsArray.length > 1) {
        multipleEntries.push({
          treatmentName,
          treatments: treatmentsArray,
        });
      } else {
        singleEntries.push({
          treatmentName,
          treatments: treatmentsArray,
        });
      }
    });

    // Send the response
    res.status(200).json({ multipleEntries, singleEntries });
  } catch (error) {
    next(error);
  }
};

exports.createTreatment = async (req, res, next) => {
  const {
    treatmentName,
    treatmentDescription,
    treatmentDetails,
    subTreatmentName,
    subTreatmentDescription,
  } = req.body;

  // Files are available as an object in req.files
  const files = req.files;

  // Find treatmentBanner file
  const treatmentBannerFile = files.find(
    (file) => file.fieldname === "treatmentBanner"
  );

  // Ensure treatmentDetails is an array
  const detailsArray = Array.isArray(treatmentDetails)
    ? treatmentDetails
    : [treatmentDetails];

  // Map over treatment details and associate image files
  const formattedDetails = detailsArray.map((detail, index) => {
    const imageFile = files.find(
      (file) => file.fieldname === `treatmentDetails[${index}][image]`
    );

    return {
      title: detail.title,
      description: detail.description,
      image: imageFile
        ? `Uploads/treatmentUploads/${imageFile.filename}`
        : null,
    };
  });

  try {
    // Prepare treatment data object
    const treatmentData = {
      treatmentName,
      treatmentDescription,
      SubTreatmentName: subTreatmentName,
      SubTreatmentDescription: subTreatmentDescription,
      treatmentDetails: formattedDetails,
      ...(treatmentBannerFile
        ? {
            treatmentBanner: `Uploads/bannerUploads/${treatmentBannerFile.filename}`,
          }
        : {}),
    };

    // Save treatment data to the database
    await adminTreatmentModel.create(treatmentData);

    // Respond with success
    return res.status(201).json({ message: "Treatment created successfully" });
  } catch (err) {
    console.error("Error creating treatment:", err);
    return next(err);
  }
};

exports.updateTreatment = async (req, res, next) => {
  const { id } = req.params;
  const {
    treatmentName,
    treatmentDescription,
    treatmentDetails,
    subTreatmentName,
    subTreatmentDescription,
  } = req.body;
  const files = req.files;

  console.log(req.body);
  console.log(req.files);

  const treatmentBannerFile = files.find(
    (file) => file.fieldname === "treatmentBanner"
  );

  // Handle treatment details
  const detailsArray = Array.isArray(treatmentDetails)
    ? treatmentDetails
    : [treatmentDetails];

  const formattedDetails = detailsArray.map((detail, index) => {
    const imageFile = files.find(
      (file) => file.fieldname === `treatmentDetails[${index}][image]`
    );

    return {
      title: detail.title,
      description: detail.description,
      image: imageFile
        ? `Uploads/treatmentUploads/${imageFile.filename}`
        : detail.image,
    };
  });

  try {
    const treatmentData = {
      treatmentName,
      treatmentDescription,
      SubTreatmentName: subTreatmentName,
      SubTreatmentDescription: subTreatmentDescription,
      treatmentDetails: formattedDetails,
      ...(treatmentBannerFile
        ? {
            treatmentBanner: `Uploads/bannerUploads/${treatmentBannerFile.filename}`,
          }
        : {}),
    };

    await adminTreatmentModel.findByIdAndUpdate(id, treatmentData, {
      new: true,
    });

    return res.status(200).json({ message: "Treatment updated successfully" });
  } catch (err) {
    next(err);
  }
};

exports.deleteTreatment = async (req, res, next) => {
  const { id } = req.params;

  try {
    const treatmentDoc = await adminTreatmentModel.findById(id);

    if (!treatmentDoc) {
      return res
        .status(404)
        .json({ error: true, message: "Treatment not found" });
    }

    // Delete the associated image
    const imagePath = path.join(
      __dirname,
      "../../",
      "Uploads/treatmentUploads",
      treatmentDoc.image
    );
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error("Error deleting image:", err);
      }
    });

    // Delete the associated banner image
    const bannerImagePath = path.join(
      __dirname,
      "../../",
      "Uploads/bannerUploads",
      treatmentDoc.bannerImage
    );
    fs.unlink(bannerImagePath, (err) => {
      if (err) {
        console.error("Error deleting banner image:", err);
      }
    });

    // Delete the treatment document
    await adminTreatmentModel.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ success: true, message: "Treatment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ error: true, message: "Error On Deleting Treatment" });
  }
};
