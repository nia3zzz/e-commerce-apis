// this file contains the unit testing of the cloudinary.uploader.upload function by uploading an image of a bird and checking the result to see if its a valid https address
import { UploadApiResponse } from 'cloudinary';
import cloudinary from './cloudinary';

// unit testing the cloudinary.uploader.upload function by uploading a bird image in the same directory and matching the url
test('Will generate an https address of the image that is uploaded.', async () => {
  const result: UploadApiResponse = await cloudinary.uploader.upload(
    'src/cloudinary/bird.jpg',
    {
      folder: 'image',
    },
  );

  expect(result.secure_url).toMatch(
    /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(:\d+)?(\/[^\s]*)?$/,
  );
});
