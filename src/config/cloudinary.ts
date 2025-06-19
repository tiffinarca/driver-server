import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export interface CloudinaryService {
  uploadImage: (fileBuffer: Buffer, options?: any) => Promise<CloudinaryUploadResult>;
  deleteImage: (publicId: string) => Promise<any>;
  updateImage: (publicId: string, fileBuffer: Buffer, options?: any) => Promise<CloudinaryUploadResult>;
}

export class CloudinaryServiceImpl implements CloudinaryService {
  async uploadImage(fileBuffer: Buffer, options: any = {}): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'image',
        folder: 'driver-profiles',
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        ...options
      };

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result as CloudinaryUploadResult);
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      ).end(fileBuffer);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  async updateImage(publicId: string, fileBuffer: Buffer, options: any = {}): Promise<CloudinaryUploadResult> {
    await this.deleteImage(publicId);
    return this.uploadImage(fileBuffer, options);
  }
} 