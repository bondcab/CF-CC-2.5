const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");

// Lambda function that gets triggered with event parameter being a JSON with info on event and context
// being an object containing information and helper methods for interrogating the state of the Lambda function
exports.handler = async function (event, context) {
  try {
    // Read data from event object.
    const region = event.Records[0].awsRegion;
    const sourceBucket = event.Records[0].s3.bucket.name;
    const sourceKey = event.Records[0].s3.object.key;
    const destinationBucket = "exercise-2.5-bucket";

    // Instantiate a new S3 client.
    const s3Client = new S3Client({
      region: region,
    });

    // Extract file name from sourceKey
    const fileName = sourceKey.split("/").pop();

    // Store the image file from S3
    const getObjectParams = {
      Bucket: sourceBucket,
      Key: sourceKey,
    };

    console.log("getObjectParams: ", getObjectParams);

    // Variable holding the GetObjectCommand
    const getObjectCommand = new GetObjectCommand(getObjectParams);

    const s3ImgRes = await s3Client.send(getObjectCommand);

    const sharpImg = sharp().resize({ width: 500 });

    s3ImgRes.Body.pipe(sharpImg);

    // Convert sharp stream to buffer
    const resizedImageBuffer = await sharpImg.toBuffer();

    // Upload the resized image to S3
    const uploadParams = {
      Bucket: destinationBucket,
      Key: `resized-images/${fileName}`,
      Body: resizedImageBuffer,
    };

    console.log("Upload params: ", uploadParams);

    const putObjectCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(putObjectCommand);
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
