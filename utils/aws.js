const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const uploadImageToS3 = async (base64Data, username, imageType) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `profile-pictures/${username}/${Date.now().toString()}.${imageType}`,
        Body: base64Data,
        ContentEncoding: 'base64',
        ContentType: `image/${imageType}`,
    };

    const command = new PutObjectCommand(params);

    try {
        const data = await s3Client.send(command);
        return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
};

module.exports = {
    uploadImageToS3,
};