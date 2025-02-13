// lambda/getImageTag.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    // Get the filename from the query string (e.g., ?filename=image.jpg)
    const filename = event.queryStringParameters.filename;
    // Use the S3 bucket name set as an environment variable in Lambda
    const bucket = process.env.S3_BUCKET;
    // Retrieve the tag set for the object
    const key = `image-test/${filename}`;
    const tagData = await s3.getObjectTagging({
      Bucket: bucket,
      Key: key,
    }).promise();         
    // Assume your S3 tagging Lambda sets a tag with Key "ImageTag"
    let tag = '';
    const tagObj = tagData.TagSet.find((t) => t.Key === 'ImageTag');
    if (tagObj) {
      tag = tagObj.Value;
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    };
  } catch (error) {
    console.error('Error fetching tag:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: '' }),
    };
  }
};
