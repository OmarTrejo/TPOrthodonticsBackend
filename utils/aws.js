const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

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
/**
 * Add a new file in AWS from Case
 */
const uploadFileToS3 = async (base64Data, key) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${key}`,
        Body: base64Data,
        ContentEncoding: 'base64',
    };

    const command = new PutObjectCommand(params);

    try {
        await s3Client.send(command);
        return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw error;
    }
};

const deleteFileFromS3 = async (fileUrl) => {
    try {
      const bucketName = process.env.AWS_BUCKET_NAME; // Cambia esto por el nombre de tu bucket
  
      // Extraer la "key" del archivo desde la URL
      const fileKey = getFileKeyFromUrl(fileUrl);

      console.log(fileKey);
  
      if (!fileKey) {
        throw new Error("No se pudo extraer la key del archivo.");
      }
  
      // Configurar los parámetros de eliminación
      const params = {
        Bucket: bucketName,
        Key: fileKey
      };
  
      // Ejecutar la eliminación
      await s3Client.send(new DeleteObjectCommand(params));
      console.log(`Archivo eliminado: ${fileKey}`);
    } catch (error) {
      console.error("Error eliminando el archivo:", error);
    }
  };

/**
 * Extrae la "Key" del archivo desde la URL completa de S3.
 * @param {string} fileUrl - URL pública del archivo en S3
 * @returns {string} Key del archivo en S3
 */
const getFileKeyFromUrl = (fileUrl) => {
    try {
      const urlObj = new URL(fileUrl);
      
      // Extrae la parte después del bucket (sin la región)
      const bucketName = "tporthodontics-repository"; // Asegúrate de que sea correcto
      const key = urlObj.pathname.replace(`/${bucketName}/`, "").substring(1); // Quita la primera "/"
  
      return key;
    } catch (error) {
      console.error("Error al extraer la key del archivo:", error);
      return null;
    }
  };

module.exports = {
    uploadImageToS3,
    uploadFileToS3,
    deleteFileFromS3
};