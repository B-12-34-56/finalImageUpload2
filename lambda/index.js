// lambda/index.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

exports.handler = async (event) => {
  try {
    // event.body is expected to be the base64-encoded image (without data URI prefix)
    const fileContent = Buffer.from(event.body, 'base64');

    // Use query parameter "filename" if provided, or generate a unique filename
    const filename =
      (event.queryStringParameters && event.queryStringParameters.filename) ||
      `image_${Date.now()}.jpg`;

    // Use the S3 bucket name from the environment variable
    const bucket = process.env.S3_BUCKET;

    // Upload the image to S3
    // After: include the prefix
    const key = `image-test/${filename}`;
    await s3.putObject({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'image/jpeg',
    }).promise();


    // Call Rekognition to detect labels
    const rekognitionParams = {
      Image: {
        S3Object: {
          Bucket: bucket,
          Name: filename,
        },
      },
      MaxLabels: 5,
      MinConfidence: 70,
    };

    const labelsResponse = await rekognition.detectLabels(rekognitionParams).promise();
    let tag = '';
    if (labelsResponse.Labels && labelsResponse.Labels.length > 0) {
      // Choose the first (top) label
      tag = labelsResponse.Labels[0].Name;
    }

    // Return success response with the tag
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Image uploaded successfully '+tag,
          filePath: `s3://${bucket}/${key}`, // now includes the "image-test/" prefix
        }),
    };      
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Upload failed',
      }),
    };
  }
};
