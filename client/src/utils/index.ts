import { uploadToCloudinary } from './cores/upload_image.cloudinary';

// Export all utilities
export * from './cores/helpers';
export * from './cores/constants';
export const upload = {
    image: uploadToCloudinary
}
